from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Literal, Sequence

import numpy as np
import pandas as pd


ForecasterName = Literal["arima"]


@dataclass
class ArimaForecastConfig:
    order: tuple[int, int, int] = (1, 1, 1)
    enforce_stationarity: bool = True
    enforce_invertibility: bool = True


@dataclass
class ForecastResult:
    model_name: str
    horizon: int
    forecast: list[float]


class TimeSeriesForecaster(ABC):
    @abstractmethod
    def forecast(self, history: Sequence[float], horizon: int) -> ForecastResult:
        raise NotImplementedError


class ArimaForecaster(TimeSeriesForecaster):
    def __init__(self, config: ArimaForecastConfig | None = None):
        self._config = config or ArimaForecastConfig()

    def forecast(self, history: Sequence[float], horizon: int) -> ForecastResult:
        if horizon <= 0:
            raise ValueError("horizon must be a positive integer")

        series = np.asarray(list(history), dtype=np.float64).reshape(-1)

        if series.size < 3:
            raise ValueError("history must contain at least 3 points for ARIMA")

        if np.isnan(series).any() or np.isinf(series).any():
            raise ValueError("history contains NaN or infinite values")

        try:
            from statsmodels.tsa.arima.model import ARIMA
        except ImportError as e:
            raise ImportError(
                "statsmodels is required for ARIMA forecasting. Please install it."
            ) from e

        cfg = self._config

        model = ARIMA(
            series,
            order=cfg.order,
            enforce_stationarity=cfg.enforce_stationarity,
            enforce_invertibility=cfg.enforce_invertibility,
        )
        fit = model.fit()
        pred = fit.forecast(steps=horizon)

        forecast_list = [float(x) for x in np.asarray(pred).reshape(-1)]

        return ForecastResult(
            model_name="arima",
            horizon=horizon,
            forecast=forecast_list,
        )


def get_forecaster(
    name: ForecasterName,
    config: ArimaForecastConfig | None = None,
) -> TimeSeriesForecaster:
    if name == "arima":
        return ArimaForecaster(config=config)
    raise ValueError(f"Unknown forecaster name: {name}")


def forecast_next_month(df: pd.DataFrame) -> float:
    if "date" not in df.columns or "emission_kg" not in df.columns:
        raise ValueError("df must contain 'date' and 'emission_kg' columns")

    work = df.copy()
    work["date"] = pd.to_datetime(work["date"], format="%Y-%m", errors="coerce")
    work = work.dropna(subset=["date", "emission_kg"])
    work = work.drop_duplicates(subset=["date"], keep="last")
    work = work.sort_values("date")

    history = work["emission_kg"].astype(float).tolist()

    if len(history) < 3:
        raise ValueError("at least 3 valid data points are required after preprocessing")

    forecaster = get_forecaster(
        "arima",
        config=ArimaForecastConfig(order=(1, 1, 1)),
    )
    result = forecaster.forecast(history=history, horizon=1)
    return result.forecast[0]