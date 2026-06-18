# -*- coding: utf-8 -*-
import sys, io, os, warnings
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
warnings.filterwarnings("ignore")
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'apps', 'AI')))

import numpy as np
import pandas as pd
from pmdarima import auto_arima

np.random.seed(42)

# ─────────────────────────────────────────────────
# 1. 시뮬레이션 데이터 (제조업 기업 12개월)
#    기저 + 계절성(여름·겨울 냉난방) + 노이즈
# ─────────────────────────────────────────────────
months = pd.date_range("2024-01", periods=12, freq="ME")
base      = np.array([50000 + i * 200 for i in range(12)])          # 50톤 기저 + 완만한 증가
seasonal  = np.array([0,2500,0,0,0,5000,5000,5000,0,0,2500,5000])   # 냉난방 피크
noise     = np.random.normal(0, base * 0.03)                         # ±3% 노이즈
actual    = np.clip(base + seasonal + noise, 30000, 110000)

df = pd.DataFrame({"date": months.strftime("%Y-%m"), "emission_kg": actual})

print("=" * 70)
print("【A-2】 ARIMA(auto) vs SMA 예측 성능 비교")
print("=" * 70)
print(f"\n  데이터: 12개월 시뮬레이션 (제조업 중소기업 패턴)")
print(f"  훈련: 9개월 / Hold-out: 마지막 3개월")
print(f"  ARIMA 모델: pmdarima auto_arima (실제 서비스와 동일 로직)\n")

print(f"{'월':<10} {'실제값(kgCO₂e)':>16}")
print("-" * 30)
for i, (d, v) in enumerate(zip(df["date"], df["emission_kg"])):
    tag = "  <- hold-out" if i >= 9 else ""
    print(f"{d:<10} {v:>14,.0f}{tag}")

# ─────────────────────────────────────────────────
# 2. Train / Hold-out
# ─────────────────────────────────────────────────
train          = actual[:9]
actual_holdout = actual[9:]

# ─────────────────────────────────────────────────
# 3. SMA (3개월 이동평균, 재귀 예측)
# ─────────────────────────────────────────────────
SMA_WINDOW = 3
history_sma = list(train)
sma_preds   = []
for _ in range(3):
    pred = np.mean(history_sma[-SMA_WINDOW:])
    sma_preds.append(pred)
    history_sma.append(pred)

# ─────────────────────────────────────────────────
# 4. auto_arima (서비스와 동일 — stepwise, AIC 기준)
# ─────────────────────────────────────────────────
model = auto_arima(
    train,
    seasonal=False,
    information_criterion="aic",
    max_p=3, max_q=3,
    stepwise=True,
    suppress_warnings=True,
    error_action="ignore",
)
arima_preds = model.predict(n_periods=3).tolist()
best_order  = model.order

# ─────────────────────────────────────────────────
# 5. 지표 계산
# ─────────────────────────────────────────────────
def mae(pred, actual):
    return float(np.mean(np.abs(np.array(pred) - np.array(actual))))

def mape(pred, actual):
    a = np.array(actual)
    return float(np.mean(np.abs((np.array(pred) - a) / a)) * 100)

sma_mae   = mae(sma_preds,   actual_holdout)
arima_mae = mae(arima_preds, actual_holdout)
sma_mape   = mape(sma_preds,   actual_holdout)
arima_mape = mape(arima_preds, actual_holdout)

mae_improve  = (sma_mae  - arima_mae)  / sma_mae  * 100
mape_improve = (sma_mape - arima_mape) / sma_mape * 100

# ─────────────────────────────────────────────────
# 6. 결과 출력
# ─────────────────────────────────────────────────
hold_dates = df["date"].values[9:]

print()
print("=" * 70)
print(f"【예측값 비교】  선택된 ARIMA 차수: {best_order}")
print("=" * 70)
print(f"{'월':<10} {'실제값':>16} {'SMA예측':>16} {'ARIMA예측':>16}")
print("-" * 62)
for i in range(3):
    print(f"{hold_dates[i]:<10} {actual_holdout[i]:>16,.0f} "
          f"{sma_preds[i]:>16,.0f} {arima_preds[i]:>16,.0f}")

print()
print("=" * 70)
print("【성능 지표 비교】")
print("=" * 70)
print(f"  {'지표':<22} {'SMA':>14} {'ARIMA':>14} {'개선율':>10}")
print(f"  {'-'*22} {'-'*14} {'-'*14} {'-'*10}")
print(f"  {'MAE (kgCO₂e)':<22} {sma_mae:>14,.1f} {arima_mae:>14,.1f} {mae_improve:>+9.1f}%")
print(f"  {'MAPE (%)':<22} {sma_mape:>13.2f}% {arima_mape:>13.2f}% {mape_improve:>+9.1f}%")

print()
mae_pass  = mae_improve >= 15
mape_pass = arima_mape  <= 10.0

print("=" * 70)
print("【평가 기준 달성 여부】")
print("=" * 70)
print(f"  ① SMA 대비 MAE 15% 이상 개선:  {mae_improve:+.1f}%  "
      f"-> {'달성 [O]' if mae_pass else '미달 [X]'}")
print(f"  ② 1개월 예측 MAPE 10% 이내:    {arima_mape:.2f}%   "
      f"-> {'달성 [O]' if mape_pass else '미달 [X]'}")

print()
print("  ※ 제한 조건 명시:")
print("     · 시뮬레이션 데이터 사용 (서비스 초기 실데이터 부족)")
print("     · ARIMA 계절성 학습 이상: 24개월 권장 vs 9개월 훈련")
print("     · 실데이터 누적 후 재검증 예정")

# ─────────────────────────────────────────────────
# 7. 3선 추이 (텍스트 차트)
# ─────────────────────────────────────────────────
print()
print("=" * 70)
print("【3선 추이】  단위: kgCO₂e")
print("=" * 70)
print(f"  {'월':<10} {'실제값':>14} {'SMA예측':>14} {'ARIMA예측':>14}")
print(f"  {'-'*10} {'-'*14} {'-'*14} {'-'*14}")
for i in range(12):
    d   = df['date'].values[i]
    act = actual[i]
    if i < 9:
        print(f"  {d:<10} {act:>14,.0f} {'[훈련]':>14} {'[훈련]':>14}")
    else:
        hi = i - 9
        print(f"  {d:<10} {act:>14,.0f} {sma_preds[hi]:>14,.0f} {arima_preds[hi]:>14,.0f}")

# ─────────────────────────────────────────────────
# 8. matplotlib 그래프 저장 (가능한 경우)
# ─────────────────────────────────────────────────
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    plt.rcParams['axes.unicode_minus'] = False
    fig, ax = plt.subplots(figsize=(10, 5))

    all_dates = df["date"].values
    ax.plot(range(12), actual, 'ko-', label='Actual', linewidth=2)
    ax.plot([8,9,10,11], [train[-1]]+sma_preds,   'b--s', label='SMA',   linewidth=1.5)
    ax.plot([8,9,10,11], [train[-1]]+arima_preds,  'r--^', label='ARIMA', linewidth=1.5)
    ax.axvline(x=8.5, color='gray', linestyle=':', alpha=0.7)
    ax.text(8.6, ax.get_ylim()[1]*0.98, 'Hold-out', fontsize=9, color='gray')
    ax.set_xticks(range(12))
    ax.set_xticklabels(all_dates, rotation=45, ha='right', fontsize=8)
    ax.set_ylabel('kgCO2e')
    ax.set_title(f'ARIMA(auto={best_order}) vs SMA  |  MAE Improvement: {mae_improve:+.1f}%')
    ax.legend()
    ax.grid(alpha=0.3)
    plt.tight_layout()

    out_path = os.path.join(os.path.dirname(__file__), 'a2_arima_chart.png')
    plt.savefig(out_path, dpi=150)
    print(f"\n  [그래프 저장] {out_path}")
except Exception as e:
    print(f"\n  [그래프 생략] {e}")
