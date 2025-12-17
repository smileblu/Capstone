import pandas as pd
import numpy as np
#기본 설정
user_id = "user123"
one_way_km = 10
round_trip_km = 20

months = pd.date_range(start="2021-01-01", periods=36, freq="MS")

commute_days = 20 + np.random.randint(-3, 4, size=len(months))
monthly_distance = round_trip_km * commute_days

EF_taxi  = 0.21
EF_bus   = 0.089
EF_metro = 0.066
EF_walk  = 0.0

modes = []
efs = []

# 통학 수단 변화 시나리오
for i in range(len(months)):
    if i < 12:                 # 1~12개월 택시
        mode = "taxi"
        ef = EF_taxi
    elif i < 18:               # 13~18개월 버스
        mode = "bus"
        ef = EF_bus
    else:                      # 19~36개월 지하철+도보
        mode = "metro_walk"
        ef = 0.8 * EF_metro + 0.2 * EF_walk

    modes.append(mode)
    efs.append(ef)

# 데이터프레임 구성
df = pd.DataFrame({
    "date": months,
    "user_id": user_id,
    "category": "transport",
    "subcategory": "commute",
    "distance_km": monthly_distance,
    "mode": modes,
    "emission_kg": monthly_distance * np.array(efs)
})

# train / test split
ts = df.set_index("date")["emission_kg"]

train = ts.iloc[:-6]   # 30개월
test = ts.iloc[-6:]    # 6개월

# 모델별 예측 1 : ARIMA
from statsmodels.tsa.arima.model import ARIMA

arima_model = ARIMA(train, order=(1,1,1))
arima_fit = arima_model.fit()

arima_forecast = arima_fit.forecast(steps=len(test))

# 모델별 예측 2 : prophet
from prophet import Prophet

prophet_df = train.reset_index()
prophet_df.columns = ["ds", "y"]

model_prophet = Prophet()
model_prophet.fit(prophet_df)

future = model_prophet.make_future_dataframe(periods=len(test), freq="MS")
prophet_pred = model_prophet.predict(future)

prophet_forecast = prophet_pred["yhat"].iloc[-len(test):].values

# 모델별 예측 3 : LSTM
import torch
import torch.nn as nn

# 1) 데이터 스케일링
train_arr = train.values.reshape(-1,1)
test_arr = test.values.reshape(-1,1)

min_val = train_arr.min()
max_val = train_arr.max()

def scale(x):
    return (x - min_val) / (max_val - min_val)

def descale(x):
    return x * (max_val - min_val) + min_val

train_scaled = scale(train_arr)
test_scaled = scale(test_arr)

# 2) LSTM 입력 만들기
def create_dataset(data, seq_len=3):
    X, y = [], []
    for i in range(len(data)-seq_len):
        X.append(data[i:i+seq_len])
        y.append(data[i+seq_len])
    return np.array(X), np.array(y)

seq_len = 3
X_train, y_train = create_dataset(train_scaled, seq_len)

X_train = torch.tensor(X_train, dtype=torch.float32)
y_train = torch.tensor(y_train, dtype=torch.float32)

# 3) 모델 정의
class LSTMModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.lstm = nn.LSTM(1, 32, batch_first=True)
        self.fc = nn.Linear(32, 1)

    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:,-1,:]
        return self.fc(out)

lstm = LSTMModel()
criterion = nn.MSELoss()
optimizer = torch.optim.Adam(lstm.parameters(), lr=0.01)

# 4) 학습
for epoch in range(200):
    lstm.train()
    optimizer.zero_grad()
    outputs = lstm(X_train)
    loss = criterion(outputs, y_train)
    loss.backward()
    optimizer.step()

# 5) 예측
lstm.eval()
prev_seq = train_scaled[-seq_len:].reshape(1, seq_len, 1)
lstm_preds = []

for _ in range(len(test)):
    pred = lstm(torch.tensor(prev_seq, dtype=torch.float32)).item()
    lstm_preds.append(pred)

    prev_seq = np.append(prev_seq[:,1:,:], [[[pred]]], axis=1)

lstm_forecast = descale(np.array(lstm_preds))

# 성능 비교
# 처음에 분리했던 test 데이터 3개월과 각 모델들이 예측한 3개월 데이터를 비교
from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np

def evaluate(true, pred):
    mae = mean_absolute_error(true, pred)
    rmse = np.sqrt(mean_squared_error(true, pred))
    return mae, rmse

results = {
    "ARIMA": evaluate(test, arima_forecast),
    "Prophet": evaluate(test, prophet_forecast),
    "LSTM": evaluate(test, lstm_forecast),
}

  # 그래프 비교
  import matplotlib.pyplot as plt

  plt.figure(figsize=(12,6))
  plt.plot(train.index, train, label="Train")
  plt.plot(test.index, test, label="Test", color="black")

  plt.plot(test.index, arima_forecast, label="ARIMA")
  plt.plot(test.index, prophet_forecast, label="Prophet")
  plt.plot(test.index, lstm_forecast, label="LSTM")

  plt.title("Model Comparison on Transport Emission Forecast")
  plt.legend()
  plt.grid(True)
  plt.show()
