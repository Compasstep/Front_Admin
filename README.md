# Front_Admin (React Client)

##  프로젝트 소개

Compassstep 서비스의 관리자용 대시보드 프론트엔드 레포지토리이다.
**Vite + React** 기반으로 구성되었고, **React Router DOM**을 통해 페이지 라우팅을 관리한다. 모든 데이터는 현재 API 연동 없이 컴포넌트 내 더미 데이터로 구현되었다.

##  주요 기능

-   ** 대시보드 (`DashboardPage.jsx`)**
    -   총 유저 수, 신규 가입자, 제재 유저 등 핵심 지표(KPI)를 확인한다.
    -   일자별 총 API 호출 횟수 시각화 차트를 제공한다.
    -   API 호출 시간 순위 목록을 제공한다.
    -   AI 재학습 검토 대기열 요약 정보를 확인한다.

-   ** 유저 관리 (`UserManagementPage.jsx`)**
    -   정지(Suspended) 및 차단(Blocked) 계정 목록을 조회한다.
    -   이름, 이메일 기반의 유저 검색 기능을 제공한다.
    -   유저 계정 상태를 '차단' 또는 '해제'로 변경한다.
    -   유저별 상세 대화 로그를 확인한다. (`UserChatLog.jsx`)

-   ** AI 재학습 (`RetrainPage.jsx`)**
    -   AI가 분석한 댓글의 감정 데이터를 검토하고 수정한다.
    -   '수정 전' / '수정 후' 탭을 통해 학습 데이터를 관리한다.
    -   `EmotionPicker.jsx` 컴포넌트를 통해 직관적으로 감정 데이터를 수정한다.

-   ** 관리자 관리 (`AdminPage.jsx`)**
    -   `root` 권한 관리자만 접근 가능하다.
    -   등록된 관리자 목록을 조회하고 검색한다.
    -   이메일을 통해 신규 관리자를 초대한다.
    -   관리자 권한을 해제하고 임시 비밀번호를 재발급한다.

-   ** 모델 선택 (`ModelSelectionPage.jsx`)**
    -   `root` 권한 관리자만 접근 가능하다.
    -   서비스에 적용할 AI 모델 버전을 선택하고 저장한다.

-   ** 인증 및 보안 (`LoginPage.jsx`, `PasswordChangePage.jsx`, `FindPasswordPage.jsx`)**
    -   관리자 로그인을 수행한다.
    -   임시 비밀번호를 발급받은 유저의 비밀번호 변경을 강제한다.
    -   이메일을 통해 비밀번호를 찾는다.

##  주요 기술 스택

-   **Build Tool**: Vite
-   **Framework**: React.js
-   **Routing**: React Router DOM
-   **Styling**: CSS (index.css) 및 인라인 스타일

> **참고**: 팀원의 `Front_User` 프로젝트와 달리, 본 프로젝트는 현재 `Zustand`, `Axios`, `Chart.js`, `Styled-Components`를 사용하지 않으며, React의 기본 `useState`와 CSS로만 구현되었다.

## 환경 설정 및 실행 방법

폴더 하나 생성 -> 마우스 우클릭 -> 여기에 PowerShell 창 열기 

### 필요한 라이브러리를 모두 설치한다.
npm create vite@latest 
Project name과 Framework : React, variant : JavaScript 선택
cd 생성한 폴더 이름
npm install

그 후 생성되는 폴더 열고 src 폴더 다 비우고 그 안에 파일들 복붙

### 개발 서버를 실행한다.
npm run dev

현재 프로젝트의 모든 데이터(유저 목록, 관리자 정보, AI 재학습 데이터 등)는 API 통신 없이 src/App.jsx 파일 내부에 하드코딩된 더미 데이터 함수(seedBefore, initialUsers, createDummyAdmins)를 통해 생성 및 관리된다. 추후 API 연동 시 해당 부분은 수정될 예정이다.
