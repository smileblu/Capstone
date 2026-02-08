# 탄소배출량 예측 
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA

def forecast_next_month(df):
    ts = df.set_index("date")["emission_kg"]

    model = ARIMA(ts, order=(1,1,1))
    fit = model.fit()

    forecast = fit.forecast(steps=1)
    return float(forecast.iloc[0])