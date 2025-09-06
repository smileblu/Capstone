#GroundRule

원활한 협업과 코드 품질 유지를 위해 다음 가이드라인을 준수합니다.

#### Git Convention

-   **Branch:** `feature/{기능명}`, `fix/{버그내용}` 등 브랜치 목적에 맞는 네이밍을 사용합니다.
-   **Commit Message:** [Conventional Commits](https://www.conventionalcommits.org/ko/v1.0.0/) 규칙을 따릅니다.
    -   `feat`: 새로운 기능 추가
    -   `fix`: 버그 수정
    -   `docs`: 문서 수정
    -   `style`: 코드 포맷팅, 세미콜론 누락 등 (코드 변경 없는 경우)
    -   `refactor`: 코드 리팩토링
    -   `test`: 테스트 코드 추가/수정
#### Code Style

-   프로젝트에 설정된 **ESLint**와 **Prettier** 규칙을 따릅니다.
-   `commit` 전 `lint`와 `format` 스크립트를 실행하여 코드 스타일을 통일합니다.
-   궁금한 점이나 막히는 부분은 혼자 고민하지 말고 언제든지 편하게 팀원들과 소통해주세요! 🫶🏻
