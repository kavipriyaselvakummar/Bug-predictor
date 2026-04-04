from fastapi import FastAPI,UploadFile,File,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np
import pandas as pd
import io

app = FastAPI(title="Bug Predictor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

with open("model.pkl","rb") as f:
    bundle = pickle.load(f)

model = bundle["model"]
selector = bundle["selector"]
scaler = bundle["scaler"]
threshold = bundle["threshold"]

class MetricsInput(BaseModel):
    loc:float = 0
    v_g:float = 0
    ev_g:float=0
    iv_g:float=0
    n:float=0
    v:float=0
    l:float=0
    d:float=0
    i:float=0
    e:float=0
    b:float=0
    t:float=0
    lOCode:float=0
    lOComment:float=0
    lOBlank:float=0
    locCodeAndComment:float=0
    uniq_Op:float=0
    uniq_Opnd:float=0
    total_Op:float=0
    total_Opnd:float=0
    branchCount:float=0

def make_result(prob:float):
    is_buggy=prob>=threshold

    if prob >= 0.7:
        risk="Critical"
    elif prob >= 0.5:
        risk = "High"
    elif prob >= threshold:
        risk = "Medium"
    else:
        risk = "Low"
    
    return{
        "probability":round(float(prob) * 100,1),
        "prediction":"Buggy" if is_buggy else "Clean",
        "risk_level":risk
    }

@app.get("/health")
def health():
    return {
        "status":"ok",
        "threshold":threshold
    }

@app.post("/predict/json")
def predict_json(data:MetricsInput):
    row = {
        "loc": data.loc, "v(g)": data.v_g, "ev(g)": data.ev_g,
        "iv(g)": data.iv_g, "n": data.n, "v": data.v,
        "l": data.l, "d": data.d, "i": data.i, "e": data.e,
        "b": data.b, "t": data.t, "lOCode": data.lOCode,
        "lOComment": data.lOComment, "lOBlank": data.lOBlank,
        "locCodeAndComment": data.locCodeAndComment,
        "uniq_Op": data.uniq_Op, "uniq_Opnd": data.uniq_Opnd,
        "total_Op": data.total_Op, "total_Opnd": data.total_Opnd,
        "branchCount": data.branchCount
    }
    df = pd.DataFrame([row])
    X = scaler.transform(df)
    X = selector.transform(X)
    prob = model.predict_proba(X)[0][1]
    return make_result(prob)

@app.post("/predict/csv")
async def predict_csv(file:UploadFile=File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400,details="Only CSV files accepted")
    
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode("utf-8")))

    if "defects" in df.columns:
        df = df.drop("defects",axis=1)
    
    df.replace("?",np.nan,inplace=True)
    df=df.apply(pd.to_numeric,errors="coerce")
    df.fillna(df.median(),inplace=True)

    X=scaler.transform(df)
    X=selector.transform(X)

    probs = model.predict_proba(X)[:,1]

    results = []
    for i,prob in enumerate(probs):
        r = make_result(prob)
        r["row"]=i+1
        results.append(r)
    buggy_count = sum(1 for r in results if r["prediction"]=="Buggy")

    return{
        "total":len(results),
        "buggy":buggy_count,
        "clean":len(results) - buggy_count,
        "results":results
    }