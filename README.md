<p align="center">
<img width="347" height="190" alt="coco logo" src="https://github.com/user-attachments/assets/985afa59-9fdc-49a6-a062-62ac13808be1" />
</p>

### 탄소배출량의 금전적 시각화와 AI 시뮬레이션으로 개인·중소기업의 탄소 중립과 ESG 관리를 지원하는 서비스

: COCO는 개인과 중소기업이 탄소 배출량을 손쉽게 추적하고 관리할 수 있도록 돕고, 시계열 예측과 감축 시나리오 분석을 통해 보다 직관적이고 실천 가능한 탄소 관리 경험을 제공합니다.

> 본 레포지토리는 COCO 프로젝트의 프론트엔드, 백엔드, AI 분석 모듈을 포함하는 통합 코드베이스입니다.  

#### ▶ 프로젝트 진행 상태

- 본 프로젝트는 산학 연계 캡스톤 프로젝트로, 핵심 기능 구현을 마치고 현재 운영 중입니다.
- 개인/중소기업 대상 탄소 배출 입력·시각화·관리 기능이 구현되어 있습니다.
- 영수증 OCR 자동 인식(CLOVA OCR), AI 기반 배출량 예측(ARIMA), 감축 시나리오 추천(Claude API), ESG 리포트 자동 생성 기능이 구현되어 있습니다.
- AI 예측 정확도 및 시나리오 추천 로직은 지속적으로 고도화되고 있습니다.

<br>


## 💡 주요 기능

#### ▶ 👤 개인용 화면 (Personal View)
- **데이터 입력**: 전기 사용량, 교통, 음식·소비 등 생활 데이터를 입력합니다.
- **탄소 배출량 계산**: 입력된 활동 데이터를 배출계수와 매핑하여 탄소 배출량을 산출합니다.
- **금전적 환산**: 탄소 배출량을 금전적 가치로 시각화하여 사용자가 배출의 영향을 직관적으로 이해할 수 있도록 합니다.
- **절감 시나리오 추천**: 대중교통 이용, 절전 습관 등 행동 변화에 따른 AI 기반 탄소 절감 시나리오를 추천합니다.
- **미션으로 실천하기**: 선택한 시나리오를 미션으로 등록해 진행 상태(진행 중/완료)를 추적하며 실천을 유도합니다.

#### ▶ 🏭 중소기업용 화면 (SME / ESG View)
- **데이터 업로드**: 생산·물류·에너지 데이터를 직접 또는 Excel 형식으로 업로드할 수 있습니다.
- **대시보드**: 시각화된 ESG 데이터를 기반으로 내부 의사결정과 대외 보고 준비를 지원합니다.
- **탄소 배출 추적**: 배출원별 탄소 배출량을 모니터링하고 이상치를 탐지합니다.
- **절감 시나리오 시뮬레이션**: AI가 기업 프로필과 배출 데이터를 분석해 투자비용 대비 감축효과를 비교한 감축 시나리오(난이도·실행가능성·투자비용·회수기간)를 추천합니다.
- **ESG 리포트 생성**: ESG 대응에 필요한 월간·연간 기준의 탄소 배출 및 ESG 대응 보고서를 자동 생성합니다.

<br>


## 📁 레포지토리 구조
```
apps/
 ├─ AI     # AI 모델 및 분석 (시계열 예측, 절감 시뮬레이션)
 ├─ FE     # 프론트엔드 (React)
 ├─ BE     # 백엔드 (Spring Boot)
 └─ OCR    # 영수증 OCR 인식 서버 (Node.js, CLOVA OCR 연동)
demo/      # 데모 및 테스트 데이터
docs/      # 프로젝트 부가 설명 및 설계 문서
```

<br>


## 📄 문서 (Documentation)

프로젝트의 설계 배경, 데이터 흐름, 탄소 배출 산정 및 절감 시나리오에 대한 부가 설명은 docs 폴더에 정리되어 있습니다.
 
<br>


## 🔗 바로 사용해보기
```
https://d2mxshd66xjgyo.cloudfront.net
```
→ [CLICK HERE](https://d2mxshd66xjgyo.cloudfront.net/)

<br>

## ⚙️ Setup

#### 1) 필수 설치
| 항목 | 버전 | 용도 |
|---|---|---|
| JDK | 17+ | Backend (Spring Boot) |
| Node.js | 20+ | Frontend, OCR 서버 |
| Python | 3.10+ | AI 서버 |
| MySQL | 8.0+ | DB (로컬 또는 Amazon RDS) |
| Docker | 선택 | BE+AI+OCR 한번에 실행할 때 |

#### 2) 레포 클론
git clone <repo-url>
cd Capstone

#### 3) 환경변수 파일 준비
| 서비스 | 파일 | 키 |
|---|---|---|
| Backend | `apps/BE/.env` | `DB_URL`, `DB_USER`, `DB_PW`, `JWT_SECRET` |
| Frontend | `apps/FE/.env` | `VITE_KAKAO_JAVASCRIPT_KEY`, `VITE_KAKAO_REST_KEY` |
| AI 서버 | `apps/AI/.env` | `CLAUDE_API_KEY` |
| OCR 서버 | `apps/OCR/.env` | `CLOVA_OCR_URL`, `CLOVA_OCR_SECRET` (필수), `CLAUDE_API_KEY` (선택) |

<br>

## ▶️ 직접 실행 방법

#### 0) 환경변수 설정 (최초 1회만)
```
cd apps/FE/.env   # VITE_KAKAO_JAVASCRIPT_KEY / VITE_KAKAO_REST_KEY 입력
cd apps/BE/.env   # DB_URL / DB_USER / DB_PW / JWT_SECRET 입력
cd apps/AI/.env   # Claude API Key / CLOVA OCR Key API 키 입력
cd apps/OCR/.env  # Claude API Key / CLOVA_OCR_URL / CLOVA OCR Key API 키 입력
```

#### 1) 백엔드 전체 실행 (BE + AI + OCR)
```
docker compose up --build
```

#### 2) 프론트엔드 실행
```
cd apps/FE
npm install
npm run dev
```

<br>


## 🛠 Tech Stack  

#### ▶ Frontend
- **Framework**: React
- **Language**: TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Charting**: Recharts
- **HTTP Client**: Axios
- **Linting & Formatting**: ESLint, Prettier
- **Deployment**: Amazon S3 + CloudFront
- **CI/CD**: GitHub Actions

#### ▶ Backend
- **Language**: Java 17
- **Framework**: Spring Boot 3.x
- **Security**: Spring Security + JWT
- **Data Access**: Spring Data JPA
- **Database**: MySQL (Amazon RDS)
- **File Processing**: Apache POI (Excel 업로드/다운로드)
- **Build Tool**: Gradle
- **Deployment**: Amazon EC2
- **CI/CD**: GitHub Actions

#### ▶ AI / Machine Learning
- **Language**: Python
- **Backend Framework**: FastAPI
- **Time-Series Forecasting**: statsmodels, pmdarima (ARIMA)
- **Anomaly Detection**: Z-score 기반 통계 기법 (numpy)
- **Data Processing**: pandas, numpy, scipy
- **Report Generation**: reportlab, matplotlib, Pillow
- **LLM**: Claude API (Anthropic)

#### ▶ OCR
- **Language**: Node.js
- **Framework**: Express
- **OCR Engine**: Naver CLOVA OCR
- **File Upload**: Multer

*(위 스택은 프로젝트 진행 상황에 따라 변경될 수 있습니다.)*

<br>


## 👤 Members
| Frontend | Backend | AI |
|:--:|:--:|:--:|
| <a href="https://github.com/minjujoy"><img src="https://avatars.githubusercontent.com/u/181975061?v=4" width="120" height="120" /></a><br/><a href="https://github.com/minjujoy">조민주</a> | <a href="https://github.com/smileblu"><img src="https://avatars.githubusercontent.com/u/181451140?s=96&v=4" width="120" height="120" /></a><br/><a href="https://github.com/smileblu">이미소</a> | <a href="https://github.com/youn1205"><img src="https://avatars.githubusercontent.com/u/164621867?v=4" width="120" height="120" /></a><br/><a href="https://github.com/youn1205">정서윤</a> | 
