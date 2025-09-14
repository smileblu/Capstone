# ✨ 클라우드 기반 탄소 관리 SaaS

### 💡 개인·학교·중소기업이 쉽게 사용하는 탄소 배출 추적 및 관리 플랫폼

이 서비스는 소규모 기관(개인, 학교, 중소기업)이 탄소 배출량을 손쉽게 추적·관리하고, 금전적 환산 및 절감 시뮬레이션을 통해 직관적인 환경 관리와 ESG 보고를 가능하게 하는 클라우드 기반 SaaS입니다.

본 레포지토리는 클라우드 기반 탄소 관리 SaaS의 프론트엔드 코드베이스를 관리합니다.

<br>

## 🎯 주요 기능

#### 🙋🏻‍♀️ 개인·학교용 화면 (Client / Education View)

-   **데이터 입력:** 전기 사용량, 교통, 종이 사용 등 생활/학교 운영 데이터를 입력합니다.
-   **탄소 배출량 계산:** AI 기반 패턴 분석으로 사용량을 탄소 배출량으로 환산합니다.
-   **금전적 환산:** 배출량을 “돈”으로 환산하여 절약 효과를 직관적으로 확인합니다.
-   **절감 시뮬레이션:** 대중교통 이용, 절전 습관 등 행동 변화에 따른 절감 시나리오 제공.
-   **교육 활용:** 학생들이 탄소 배출과 비용의 연관성을 직관적으로 학습 가능.

#### 👩‍💼 기업용 화면 (SME / ESG View)

-   **데이터 업로드:** 생산·물류·에너지 데이터를 API 또는 Excel로 손쉽게 업로드.
-   **탄소 배출 추적:** 배출원별 탄소 배출량을 모니터링하고 이상치 탐지.
-   **환경 회계 리포트:** ESG 보고서용 월간/연간 자동 리포트 생성.
-   **대시보드:** 시각화된 ESG 데이터로 경영진 및 외부 공시에 활용.
-   **규제 대응:** ESG 보고서 자동 제출 기능으로 규제 준수 용이화.


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

---

### ⚙️ Backend  
- **Language / Framework**: Java 17, Spring Boot 3.x, Spring Security, Spring Data JPA  
- **Storage**: RDBMS (Dev: H2, Prod: Amazon RDS)  
- **Build / Deploy**: Gradle, GitHub Actions (CI/CD), Nginx, Amazon EC2  
- **Observability**: Micrometer, Prometheus, Discord Alerts  
- **Etc.**: Swagger (OpenAPI 3), Flyway (DB Migration), JUnit 5 (Test)  

---

### 🤖 AI / Machine Learning  
- **Language**: Python  
- **AI/ML**: PyTorch, scikit-learn  
- **Data Processing**: pandas, NumPy  
- **Backend Framework**: FastAPI  
- **Database**: SQLite  

---

*(위 스택은 프로젝트 진행 상황에 따라 변경될 수 있습니다.)*  

---

*(위 스택은 프로젝트 진행 상황에 따라 변경될 수 있습니다.)*  


<br>

## 🚀 프로젝트 시작하기

```bash
# 1. 레포지토리를 클론합니다.
$ git clone []
```
## 📁 폴더 구조
```
