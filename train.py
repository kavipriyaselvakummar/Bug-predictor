import pandas as pd
import numpy as np
import pickle

from sklearn.model_selection import train_test_split
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import classification_report, accuracy_score,roc_auc_score
from imblearn.combine import SMOTETomek
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.preprocessing import RobustScaler
from xgboost import XGBClassifier

df = pd.read_csv("jm1.csv")
print("Shape:",df.shape)

df.replace('?',np.nan,inplace = True)
df = df.apply(pd.to_numeric,errors = 'coerce')

df.fillna(df.median(),inplace = True)   

df['defects'] = df['defects'].apply(lambda x: 1 if x>0 else 0)

X = df.drop('defects',axis=1)
y = df['defects']


X_train,X_test,y_train,y_test = train_test_split(X,y,test_size = 0.2 , random_state = 42,stratify=y)
scaler = RobustScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)
selector = SelectKBest(f_classif,k=18)
X_train = selector.fit_transform(X_train,y_train)
X_test = selector.transform(X_test)
smote_tomek = SMOTETomek(sampling_strategy=0.6,random_state=42)
X_train,y_train = smote_tomek.fit_resample(X_train,y_train)
neg = (y_train == 0).sum()
pos = (y_train == 1).sum()
ratio = neg/pos
print(f"Scale pos wei={ratio:.2f}")
model = XGBClassifier(n_estimators=300,learning_rate=0.03,max_depth=4,subsample = 0.8,colsample_bytree=0.8,scale_pos_weight=ratio,eval_metric='aucpr',random_state=42,use_label_encoder=False)
#model  = RandomForestClassifier(n_estimators=200,random_state=42,class_weight={0:1,1:5})
model.fit(X_train,y_train)
y_prob = model.predict_proba(X_test)[:,1]
for thresh in [0.25,0.30,0.35,0.40,0.45,0.50]:
    y_pred=(y_prob>=thresh).astype(int)
    report = classification_report(y_test,y_pred,output_dict = True)
    print(f"Threshold:{thresh}")
BEST_THRESHOLD = 0.35
y_pred_final = (y_prob>=BEST_THRESHOLD).astype(int)
print("Accuracy:",accuracy_score(y_test,y_pred))
print("Classification report:",classification_report(y_test,y_pred_final))
print("ROC-AUC:", roc_auc_score(y_test,y_prob))

with open("model.pkl","wb") as f:
    pickle.dump({"model":model,"selector":selector,"scaler":scaler,"threshold":BEST_THRESHOLD},f)

print("Model saved successfully")