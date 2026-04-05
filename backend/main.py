from fastapi import FastAPI,UploadFile,File,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np
import pandas as pd
import io
import tempfile
import os

from radon.raw import analyze
from radon.complexity import cc_visit
from radon.metrics import mi_visit, h_visit
from radon.visitors import HalsteadVisitor

app = FastAPI(title="Bug Predictor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(__file__)   # points to backend/
model_path = os.path.join(BASE_DIR, "model.pkl")

with open(model_path, "rb") as f:
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

# ---------------------------------------------------------------------------
# Helper: extract per-function metrics from Python source using Radon API
# ---------------------------------------------------------------------------

def _extract_metrics_from_source(source: str):
    """Return a list of dicts, one per function, with 21 model features."""
    # Cyclomatic complexity per function
    cc_results = cc_visit(source)
    cc_map = {block.name: block.complexity for block in cc_results}

    # Halstead per function
    try:
        hal_visitor = HalsteadVisitor.from_code(source)
    except Exception:
        hal_visitor = None

    # Build a lookup of Halstead metrics per function
    func_hal = {}
    if hal_visitor and hasattr(hal_visitor, 'function_names'):
        # HalsteadVisitor stores per-function data
        for fname, metrics in zip(hal_visitor.function_names, hal_visitor.function_stats):
            func_hal[fname] = metrics

    # Raw metrics (file-level)
    try:
        raw = analyze(source)
    except Exception:
        raw = None

    # Maintainability index (file-level)
    try:
        mi_score = mi_visit(source, True)
    except Exception:
        mi_score = 0

    # Halstead for the whole file
    try:
        h_total = h_visit(source)
    except Exception:
        h_total = None

    rows = []

    for block in cc_results:
        func_name = block.name
        v_g = block.complexity

        # Try to get per-function Halstead; fall back to file-level
        h = func_hal.get(func_name, None)

        if h and hasattr(h, 'volume'):
            h1 = getattr(h, 'h1', 0) or 0
            h2 = getattr(h, 'h2', 0) or 0
            N1 = getattr(h, 'N1', 0) or 0
            N2 = getattr(h, 'N2', 0) or 0
            vocabulary = getattr(h, 'vocabulary', 0) or 0
            length = getattr(h, 'length', 0) or 0
            volume = getattr(h, 'volume', 0) or 0
            difficulty = getattr(h, 'difficulty', 0) or 0
            effort = getattr(h, 'effort', 0) or 0
            bugs = getattr(h, 'bugs', 0) or 0
            time = getattr(h, 'time', 0) or 0
        elif h_total and len(h_total) > 0:
            ht = h_total[0]
            h1 = getattr(ht, 'h1', 0) or 0
            h2 = getattr(ht, 'h2', 0) or 0
            N1 = getattr(ht, 'N1', 0) or 0
            N2 = getattr(ht, 'N2', 0) or 0
            vocabulary = getattr(ht, 'vocabulary', 0) or 0
            length = getattr(ht, 'length', 0) or 0
            volume = getattr(ht, 'volume', 0) or 0
            difficulty = getattr(ht, 'difficulty', 0) or 0
            effort = getattr(ht, 'effort', 0) or 0
            bugs = getattr(ht, 'bugs', 0) or 0
            time = getattr(ht, 'time', 0) or 0
        else:
            h1 = h2 = N1 = N2 = 0
            vocabulary = length = volume = difficulty = 0
            effort = bugs = time = 0

        n_val = length if length else (N1 + N2)
        v_val = volume
        d_val = difficulty
        e_val = effort
        b_val = bugs
        t_val = time
        l_val = round(1 / d_val, 4) if d_val > 0 else 0
        i_val = round(v_val / d_val, 4) if d_val > 0 else 0

        loc = N1 + N2 if (N1 + N2) > 0 else max(1, block.endline - block.lineno + 1)
        lOCode = max(1, int(loc * 0.7))
        lOComment = max(0, int(loc * 0.1))
        lOBlank = max(0, int(loc * 0.1))
        locCodeAndComment = lOComment
        ev_g = max(1, v_g - 2)
        iv_g = max(1, v_g - 1)
        branchCount = max(0, (v_g - 1) * 2)

        metrics = {
            "loc": loc,
            "v_g": v_g,
            "ev_g": ev_g,
            "iv_g": iv_g,
            "n": n_val,
            "v": round(v_val, 2),
            "l": l_val,
            "d": round(d_val, 2),
            "i": round(i_val, 2),
            "e": round(e_val, 2),
            "b": round(b_val, 4),
            "t": round(t_val, 2),
            "lOCode": lOCode,
            "lOComment": lOComment,
            "lOBlank": lOBlank,
            "locCodeAndComment": locCodeAndComment,
            "uniq_Op": h1,
            "uniq_Opnd": h2,
            "total_Op": N1,
            "total_Opnd": N2,
            "branchCount": branchCount,
        }

        rows.append({
            "function": func_name,
            "metrics": metrics,
            "mi_score": round(mi_score, 2) if mi_score else 0,
        })

    return rows, raw, mi_score


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
    if "function" in df.columns:
        df = df.drop("function", axis=1)
    df.replace("?",np.nan,inplace=True)
    df=df.apply(pd.to_numeric,errors="coerce")
    df = df.select_dtypes(include=[np.number])
    df.fillna(df.median(),inplace=True)

    if df.shape[1] < 21:
        raise HTTPException(
            status_code=400,
            detail=f"CSV has only {df.shape[1]} numeric columns but 21 are needed."
        )

    # Take first 21 columns
    df = df.iloc[:, :21]

    # Force correct column names
    df.columns = [
        "loc", "v(g)", "ev(g)", "iv(g)", "n", "v", "l", "d", "i", "e",
        "b", "t", "lOCode", "lOComment", "lOBlank", "locCodeAndComment",
        "uniq_Op", "uniq_Opnd", "total_Op", "total_Opnd", "branchCount"
    ]

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


# ---------------------------------------------------------------------------
# NEW ENDPOINT: Analyze a .py file
# ---------------------------------------------------------------------------

@app.post("/analyze-file")
async def analyze_file(file: UploadFile = File(...)):
    # Validate file extension
    if not file.filename.endswith(".py"):
        raise HTTPException(status_code=400, detail="Only .py files are accepted.")

    contents = await file.read()
    if not contents or len(contents.strip()) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    source = contents.decode("utf-8")

    # Extract metrics using Radon
    try:
        func_rows, raw_metrics, mi_score = _extract_metrics_from_source(source)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error analysing file: {str(exc)}")

    if not func_rows:
        raise HTTPException(
            status_code=400,
            detail="No functions or classes found in the uploaded file."
        )

    # Run each function's metrics through the model
    function_results = []
    all_probs = []
    total_complexity = 0
    total_volume = 0
    total_effort = 0
    total_bugs = 0

    for row in func_rows:
        m = row["metrics"]
        df_row = {
            "loc": m["loc"], "v(g)": m["v_g"], "ev(g)": m["ev_g"],
            "iv(g)": m["iv_g"], "n": m["n"], "v": m["v"],
            "l": m["l"], "d": m["d"], "i": m["i"], "e": m["e"],
            "b": m["b"], "t": m["t"], "lOCode": m["lOCode"],
            "lOComment": m["lOComment"], "lOBlank": m["lOBlank"],
            "locCodeAndComment": m["locCodeAndComment"],
            "uniq_Op": m["uniq_Op"], "uniq_Opnd": m["uniq_Opnd"],
            "total_Op": m["total_Op"], "total_Opnd": m["total_Opnd"],
            "branchCount": m["branchCount"],
        }
        df = pd.DataFrame([df_row])
        X = scaler.transform(df)
        X = selector.transform(X)
        prob = model.predict_proba(X)[0][1]
        all_probs.append(prob)

        prediction = make_result(prob)

        # Accumulate for averages
        total_complexity += m["v_g"]
        total_volume += m["v"]
        total_effort += m["e"]
        total_bugs += m["b"]

        # Add display-friendly keys for the frontend table
        function_results.append({
            "function_name": row["function"],
            "metrics": {
                "loc": m["loc"],
                "v(g)": m["v_g"],
                "v": m["v"],
                "e": m["e"],
                "b": m["b"],
            },
            "prediction": prediction,
        })

    n_funcs = len(func_rows)

    # Overall prediction uses the maximum bug probability across all functions
    max_prob = max(all_probs)
    overall_prediction = make_result(max_prob)

    # File-level aggregated metrics
    file_loc = raw_metrics.loc if raw_metrics else sum(r["metrics"]["loc"] for r in func_rows)
    file_metrics = {
        "loc": file_loc,
        "avg_complexity": total_complexity / n_funcs,
        "maintainability_index": round(mi_score, 2) if mi_score else 0,
        "avg_halstead_volume": total_volume / n_funcs,
        "avg_halstead_effort": total_effort / n_funcs,
        "avg_halstead_bugs": total_bugs / n_funcs,
    }

    return {
        "filename": file.filename,
        "functions_analyzed": n_funcs,
        "overall_prediction": overall_prediction,
        "file_metrics": file_metrics,
        "function_results": function_results,
    }