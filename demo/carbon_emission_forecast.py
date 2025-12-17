## 탄소 배출량 가상 데이터 생성 + 시계열 예측 ver1. 간단한 버전

#교통 관련으로 12개월 가량의 탄소배출량 데이터를 가상으로 생성한 후 생성된 데이터 기반으로 그 다음 3개월을 ARIMA 이용해서 예측함.

import pandas as pd
import numpy as np

#1. 기본 설정(통학 거리/기간)

np.random.seed(42)

user_id = "user123"
one_way_km = 10
round_trip_km = 20
# 편도 10km, 왕복 20km의 통학을 하는 학생이라고 가정

months = pd.date_range(start="2024-01-01", periods=12, freq="MS")

commute_days = 20 + np.random.randint(-3, 4, size=len(months))
monthly_distance = round_trip_km * commute_days
# 한 달 중에 17~23일 (20일 내외)의 통학을 한다고 가정함

# 2. 배출 계수 (가상 데이터 생성용)
EF_taxi  = 0.21
EF_bus   = 0.089
EF_metro = 0.066
EF_walk  = 0.0

# 3. 통학 수단 변화 시나리오
# 우리의 서비스를 중간에 이용하기 시작했다고 가정해 승용차 이용에서 버스이용, 지하철+도보 이용으로 이용하는 대중교통 수단이 바뀐 시나리오를 가정했음
modes = []
efs = []

for i in range(len(months)):
    if i < 6:
        mode = "taxi"
        ef = EF_taxi
    elif i < 8:
        mode = "bus"
        ef = EF_bus
    else:
        mode = "metro_walk"
        ef = 0.8 * EF_metro + 0.2 * EF_walk

    modes.append(mode)
    efs.append(ef)


#4. DataFrame 구성 (Transport 카테고리 내부에 있다고 생각했고, 앞으로 여러 카테고리에서의 데이터 입력에 따라 확장 가능한 데이터 프레임을 만들려고 노력함)

df = pd.DataFrame({
    "date": months,
    "user_id": user_id,
    "category": "transport",
    "subcategory": "commute",
    "distance_km": monthly_distance,
    "mode": modes,
    "emission_kg": monthly_distance * np.array(efs),
})

from statsmodels.tsa.arima.model import ARIMA
import matplotlib.pyplot as plt

ts_df = df.copy()
ts_df = ts_df.set_index("date")

y = ts_df["emission_kg"]
print("< 탄소배출량 데이터 전체 >")

# 모델 학습시키기
model = ARIMA(y, order=(1,1,1))
# AR(1) : 과거 값 1개까지 참고 / I(1) : 한 번 차분해서 추세 제거 / MA(1) : 과거 오차 1개까지 참고
fit = model.fit()
# 모델 학습

# 미래 3개월 예측
forecast_steps = 3
forecast = fit.forecast(steps=forecast_steps)

future_index = pd.date_range(
    start=ts_df.index[-1] + pd.offsets.MonthBegin(1),
    periods=forecast_steps,
    freq="MS"
)
forecast_series = pd.Series(forecast.values, index=future_index)
print (" < 이후 3개월 데이터 예측 > ")
print (forecast_series)

#시각화
plt.figure(figsize=(10,5))
plt.plot(y, label="Historical emission (kgCO2)")
plt.plot(forecast_series,
         label="Forecast emission (kgCO2)",
         linestyle="--")
plt.title("Transport Carbon Emission Forecast (ARIMA)")
plt.xlabel("Month")
plt.ylabel("kgCO₂")
plt.legend()
plt.grid(True)
plt.show()
