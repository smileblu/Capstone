| 항목 | 내용 |
|------|------|
| 프로젝트명 | 개인, 중소기업과 같은  소규모 사용자들이 탄소 배출량을 금전적 비용과 미래 영향으로 환산해 직관적으로 체감하고, 절감 방안 시뮬레이션을 제시해 개선되도록 돕는 탄소 관리 시뮬레이션 서비스 |
| 프로젝트 키워드 | 탄소배출량, ESG 경영, 절감 시뮬레이션 |
| 트랙 | 산학 |
| 프로젝트 멤버 | 정서윤, 이미소, 조민주 |
| 팀 지도교수님 | 반효경 교수님 |
| 무엇을 만들고자 하는가 | 소규모 사용자들을 위한 경량화된 클라우드 기반 탄소 관리 SaaS 플랫폼을 만들고자 한다. 사용자가 입력한 데이터를 기반으로 탄소 배출량과 금전적 비용을 자동 환산하고, 직관적인 리포트로 보여준다. AI 기반으로 미래 배출량을 예측하고, 효과적 절감 방안을 시뮬레이션으로 제시해 사용자가 지속 가능한 일상과 비즈니스를 실현하도록 돕는다. |
| 고객 | 👩🏻‍🎓 박에코 (23세, 대학생) <br>•목표 : 탄소 배출량을 줄이는 것이 생활비 절감으로 이어지는 체감적 효과 경험 <br>•문제점 : 작은 절약의 효과가 가시적이지 않아 행동 변화의 동기를 찾는 것에 어려움 느낌<br>•요구사항 : 탄소 배출량을 돈으로 환산해 보여주고, 내 행동이 누적되어 의미 있는 결과를 가져오는 경험을 원함<br><br>💼 김그린(43세, 중소기업 CEO)<br>•목표: 대기업(납품처)에서의 요구나 해외 수출을 위한 ESG 보고서 생성<br>•문제점: 전문 인력(ESG 전담팀) 부재로 인해 회계팀에서 매번 Excel로 데이터 수집하면 비효율과 오류 발생, 외부 컨설팅 업체 이용 시 비용 과다<br>•요구사항: 탄소 배출량 계산 자동화와 시각화, 국제 표준 ESG 보고서 제공, 탄소 절감 전략 제안|
| Pain Point | 개인 <br>• 동기 부족 <br>- 단순히 “몇 kg CO₂”라는 추상적 수치만 제공 → 행동 변화로 이어지지 않음 <br>- 생활비 절감 등 즉각적 보상이 없어 실천 동기 낮음 <br>- 작은 행동이 거대한 기후 위기에 의미가 있는지 회의감 발생 <br>• 정보 불투명 & 피드백 부재 <br>- 탄소 계산 방식이 복잡하고 불투명하게 느껴져 신뢰도 저하 가능성 <br>- “얼마나 줄여야 효과가 있는지”에 대한 구체적 가이드 부족 <br>- 절약 방법이나 실천적 피드백이 없어 습관 변화로 연결되지 않음 <br><br>중소기업 <br>• 대기업 중심 솔루션의 한계 <br>- ESG 관리 툴이 대기업 전용으로 설계 → 비용·기능 모두 중소기업에게는 과도한 부담 <br>- ESG 컨설팅 비용(평균 8,600만 원 수준)이 현실적으로 감당 불가 <br>• 데이터 관리 비효율 <br>- 전력·물류·생산 데이터가 파편화 → Excel로 수작업 관리 → 시간 소모 & 오류 위험 <br>- 실시간 탄소 배출량 모니터링 불가 <br>• 보고서 작성 부담 & 신뢰성 부족 <br>- ESG 전담 인력이 없어 보고서 작성이 큰 부담 <br>- 규제 기관·대기업 제출 시 요구되는 산출 근거 충족 어려움 → 신뢰도 저하 <br>- 자동화된 보고·시각화 툴 부재로 시간과 비용 추가 소요 <br><br>공통 <br>• 데이터 기반 인사이트 부족 <br>- 단순 수치 제공에 그침 → 예측, 이상치 탐지, 절감 방안 추천 같은 데이터 기반 의사결정 지원 미흡 <br>|
| 사용할 소프트웨어 패키지의 명칭과 핵심기능/용도 |**AI / Data** <br>- ARIMA : 시계열 예측 <br>- scikit-learn : 이상치 탐지 <br>- D3.js, Chart.js : 시각화<br>- pycarbon : 샘플 데이터 <br><br>- **Frontend** <br>- Zustand : 상태 관리 <br>- React Query + Axios : 서버 통신·캐싱 <br>- Tailwind CSS : UI 스타일링·대시보드 <br>- Recharts / Chart.js : 데이터 시각화 <br><br> **Backend**<br>- AWS EC2 : 서버 배포 및 운영 <br>- AWS S3 : 데이터·리포트 파일 저장 <br>- MySQL : 사용자·탄소 데이터 관리 <br>- Python : 데이터 처리·산출 로직 <br>- Docker : 컨테이너 기반 배포 <br>|
| 사용할 소프트웨어 패키지의 명칭과 URL | **AI / Data** <br>- ARIMA : https://www.statsmodels.org/stable/tsa.html <br>- scikit-learn : https://scikit-learn.org/stable/ <br>- D3.js : https://d3js.org/ <br>- Chart.js : https://www.chartjs.org/ <br>- pycarbon : https://github.com/jackylk/pycarbon <br><br>**Frontend** <br>- Zustand : https://zustand-demo.pmnd.rs/ <br>- Tailwind CSS : https://tailwindcss.com/ <br>- React Query : https://tanstack.com/query/latest <br>- Axios : https://axios-http.com/docs/intro <br>- ESLint : https://eslint.org/ <br>- Prettier : https://prettier.io/ <br><br> **Backend** <br>- AWS EC2, S3 : https://aws.amazon.com/ <br>- MySQL : https://www.mysql.com/ <br>- Python : https://www.python.org/ <br>- Docker : https://www.docker.com/ <br>|
| 팀그라운드룰 | https://github.com/smileblu/Capstone/blob/main/GroudRule.md |
| 팀repository | https://github.com/smileblu/Capstone |
| 최종수정일 | 2025.12.17. |

