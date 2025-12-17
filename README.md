# ✨ COCO

### 💡 개인, 중소기업과 같은 소규모 사용자들이 탄소  배출량을 금전적 비용과 미래 영향으로 환산해 직관적으로 체감하고, 절감 방안 시뮬레이션을 제시하여 개선되도록 돕는 탄소 관리 서비스 

이 서비스는 소규모 기관(개인, 중소기업)이 탄소 배출량을 손쉽게 추적·관리하고, 금전적 환산 및 절감 시뮬레이션을 통해 직관적인 환경 관리와 ESG 보고를 가능하게 하는 클라우드 기반 SaaS입니다.
본 레포지토리는 클라우드 기반 탄소 관리 SaaS의 프론트엔드 코드베이스를 관리합니다.

> 📌 본 레포지토리는 COCO 프로젝트의 **전체 소스 코드를 포함하는 통합 레포지토리**입니다.   
> 프론트엔드 UI, 백엔드 서버, AI 기반 분석 및 절감 시나리오 로직이 함께 관리됩니다.


<br>

#### 🚧 프로젝트 진행 상태

- 본 프로젝트는 산학 연계 프로젝트로 현재 개발 진행 중입니다.
- 개인/중소기업 대상 탄소 배출 시각화 및 관리 기능이 구현되어 있습니다.
- AI 기반 배출 예측 및 절감 시나리오는 지속적으로 고도화되고 있습니다.

<br>

## 🎯 주요 기능

#### 🙋🏻‍♀️ 개인용 화면 (Client / Education View)

-   **데이터 입력:** 전기 사용량, 교통, 종이 사용 등 생활/학교 운영 데이터를 입력합니다.
-   **탄소 배출량 계산:** AI 기반 패턴 분석으로 사용량을 탄소 배출량으로 환산합니다.
-   **금전적 환산:** 배출량을 “돈”으로 환산하여 절약 효과를 직관적으로 확인합니다.
-   **절감 시뮬레이션:** 대중교통 이용, 절전 습관 등 행동 변화에 따른 절감 시나리오 제공.

#### 👩‍💼 기업용 화면 (SME / ESG View)

-   **데이터 업로드:** 생산·물류·에너지 데이터를 API 또는 Excel로 손쉽게 업로드.
-   **탄소 배출 추적:** 배출원별 탄소 배출량을 모니터링하고 이상치 탐지.
-   **환경 회계 리포트:** ESG 보고서용 월간/연간 자동 리포트 생성.
-   **대시보드:** 시각화된 ESG 데이터로 경영진 및 외부 공시에 활용.
-   **규제 대응:** ESG 보고서 자동 제출 기능으로 규제 준수 용이화.

<br>

## 📁 레포지토리 구조
```
src/
 ├─ components/      # 재사용 가능한 UI 컴포넌트
 ├─ pages/           # 페이지 단위 컴포넌트
 ├─ store/           # 전역 상태 관리 (Zustand)
 ├─ api/             # API 통신 모듈
 ├─ hooks/           # 커스텀 훅
 └─ utils/           # 공통 유틸리티
docs/                # 프로젝트 부가 설명 및 설계 문서
```

<br>

## 📄 문서 (Documentation)

프로젝트의 설계 배경, 데이터 흐름,
탄소 배출 산정 및 절감 시나리오에 대한 부가 설명은
docs
 폴더에 정리되어 있습니다.
 
<br>

## ▶️ 실행 방법 (Frontend)
```
npm install
npm run dev
```

기본적으로 로컬 환경에서 프론트엔드 애플리케이션이 실행됩니다.

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
- **Language / Framework**: Java 17, Spring Boot 3.x, Spring Security, Spring Data JPA  
- **Storage**: RDBMS (Dev: H2, Prod: Amazon RDS)  
- **Build / Deploy**: Gradle, GitHub Actions (CI/CD), Amazon EC2  
- **Etc.**: Swagger (OpenAPI 3)


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
