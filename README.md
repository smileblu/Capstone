# ✨ COCO

### 💡 ESG 관리 장벽 해소를 위해 탄소배출량 금전적 시각화와 AI 시뮬레이션으로 개인의 행동 변화와 중소기업 의사결정 지원 서비스

COCO는 개인과 중소기업이 탄소 배출량을 손쉽게 추적하고 관리할 수 있도록 돕고, 시계열 예측과 감축 시나리오 분석을 통해 보다 직관적이고 실천 가능한 탄소 관리 경험을 제공합니다.

> 본 레포지토리는 COCO 프로젝트의 프론트엔드, 백엔드, AI 분석 모듈을 포함하는 통합 코드베이스입니다.  

#### 📌 프로젝트 진행 상태

- 본 프로젝트는 산학 연계 프로젝트로 현재 개발 진행 중입니다.
- 개인/중소기업 대상 탄소 배출 시각화 및 관리 기능이 구현되어 있습니다.
- AI 기반 배출 예측 및 절감 시나리오는 지속적으로 고도화되고 있습니다.

<br>

## 🎯 주요 기능

#### 🙋🏻‍♀️ 개인용 화면 (Client / Education View)
- **데이터 입력**: 전기 사용량, 교통, 종이 사용 등 생활 및 학교 운영 데이터를 입력합니다.
- **탄소 배출량 계산**: 입력된 활동 데이터를 배출계수와 매핑하여 탄소 배출량을 산출합니다.
- **금전적 환산**: 탄소 배출량을 금전적 가치로 시각화하여 사용자가 배출의 영향을 직관적으로 이해할 수 있도록 합니다.
- **절감 시뮬레이션**: 대중교통 이용, 절전 습관 등 행동 변화에 따른 탄소 절감 시나리오를 제공합니다.

#### 👩‍💼 기업용 화면 (SME / ESG View)
- **데이터 업로드**: 생산·물류·에너지 데이터를 직접 또는 Excel 형식으로 업로드할 수 있습니다.
- **대시보드**: 시각화된 ESG 데이터를 기반으로 내부 의사결정과 대외 보고 준비를 지원합니다.
- **탄소 배출 추적**: 배출원별 탄소 배출량을 모니터링하고 이상치를 탐지합니다.
- **ESG 리포트 생성**: ESG 대응에 필요한 월간·연간 기준의 탄소 배출 및 ESG 대응 보고서를 자동 생성합니다.

<br>

## 📁 레포지토리 구조
```
apps/
 ├─ AI     # AI 모델 및 분석 (시계열 예측, 절감 시뮬레이션)
 ├─ FE     # 프론트엔드 (React)
 └─ BE     # 백엔드 (Spring Boot)
demo/      # 데모 및 테스트 데이터
docs/      # 프로젝트 부가 설명 및 설계 문서
```

<br>

## 📄 문서 (Documentation)

프로젝트의 설계 배경, 데이터 흐름,
탄소 배출 산정 및 절감 시나리오에 대한 부가 설명은
docs
 폴더에 정리되어 있습니다.
 
<br>

## ▶️ 실행 방법 (Frontend) <br>
🎨 **Frontend**
```
cd apps/FE
npm install
npm run dev
```
⚙️ **Backend**
```
cd apps/BE
./gradlew bootRun
```

<br>

## 🛠 Tech Stack  

### 🎨 Frontend  
- **Framework**: React  
- **Language**: TypeScript  
- **State Management**: Zustand  
- **Styling**: Tailwind CSS  
- **Data Fetching**: React Query  
- **HTTP Client**: Axios  
- **Linting & Formatting**: ESLint, Prettier  

### ⚙️ Backend  
- **Language**: Java 17  
- **Framework**: Spring Boot 3.x  
- **Security**: Spring Security (Planned)
- **Data Access**: Spring Data JPA  
- **Database**: MySQL (Local), Amazon RDS (Planned)    
- **Build Tool**: Gradle  
- **API Documentation**: Swagger (OpenAPI 3)  
- **Deployment**: Amazon EC2  
- **CI/CD**: GitHub Actions  

### 🤖 AI / Machine Learning  
- **Language**: Python  
- **AI/ML**: PyTorch, scikit-learn  
- **Data Processing**: pandas  
- **Backend Framework**: FastAPI  
- **Database**: SQLite  

*(위 스택은 프로젝트 진행 상황에 따라 변경될 수 있습니다.)*  

<br>

## 👤 Members
| Frontend | Backend | AI |
|:--:|:--:|:--:|
| <a href="https://github.com/minjujoy"><img src="https://avatars.githubusercontent.com/u/181975061?v=4" width="120" height="120" /></a><br/><a href="https://github.com/minjujoy">조민주</a> | <a href="https://github.com/smileblu"><img src="https://avatars.githubusercontent.com/u/181451140?s=96&v=4" width="120" height="120" /></a><br/><a href="https://github.com/smileblu">이미소</a> | <a href="https://github.com/youn1205"><img src="https://avatars.githubusercontent.com/u/164621867?v=4" width="120" height="120" /></a><br/><a href="https://github.com/youn1205">정서윤</a> | 
