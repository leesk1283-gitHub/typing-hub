# 🎮 Typing Hub (타자 포털)

![Main Portal](https://img.shields.io/badge/Status-Complete-success)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

Typing Hub는 웹 브라우저에서 즐길 수 있는 **타자 연습 서비스**와 **멀티플레이어 풍선 타자 게임**을 하나로 통합한 포털 사이트입니다. 깔끔하고 직관적인 UI를 통해 타자 실력을 향상시키고 전 세계 사용자들과 실시간 대결을 즐겨보세요!
**바로가기**: https://leesk1283-github.github.io/typing-hub

## 🚀 주요 기능

### ⌨️ 타자 연습 (Typing Practice)
- [https://leesk1283-github.github.io/typing-hub/](https://leesk1283-github.github.io/typing-hub/typing-practice/)
- **자리 연습**: 기본 자리, 윗 자리, 가운데 자리, 아랫 자리 연습
- **낱말 연습**: 자주 쓰이는 단어 위주의 순발력 연습
- **문장 연습**: 긴 문장을 통한 실전 타자 속도 측정
- **실시간 통계**: 정확도(ACC), 속도(WPM) 등을 실시간으로 확인

### 🎈 풍선 타자 게임 (Balloon Typing Game)
- **실시간 멀티플레이어**: 최대 8인 동시 대결
- **점수 획득**: 단어 길이에 따른 점수 차등 부여
- **로비**: 방 만들기, 빠른 입장 등 편리한 게임 참여 환경
- **반응형 디자인**: 어떤 해상도에서도 쾌적하게 플레이 가능

## 🛠 기술 스택

- **Frontend**: HTML5, CSS3 (Vanilla CSS), JavaScript (ES6+)
- **Backend**: Node.js, Express
- **Real-time**: Socket.io
- **Deployment**: Render

## 📦 설치 및 로컬 실행 방법

1. 저장소를 클론합니다:
   ```bash
   git clone https://github.com/leesk1283/typing-hub.git
   cd typing-hub
   ```

2. 의존성 패키지를 설치합니다:
   ```bash
   npm install
   ```

3. 서버를 실행합니다:
   ```bash
   npm start
   ```
   또는 개발 모드(자동 재시작)로 실행:
   ```bash
   npm run dev
   ```

4. 브라우저에서 `http://localhost:3000` 접속!

## 🌐 배포 안내 (Deployment)

본 프로젝트는 Node.js 서버와 WebSocket(Socket.io)을 사용하므로, 이를 지원하는 플랫폼(Render, Railway 등)에 배포하는 것이 좋습니다.

### Render.com 배포 기준:
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: `PORT` 환경 변수는 자동으로 할당됩니다.

## 📄 라이선스

이 프로젝트는 [MIT License](LICENSE)에 따라 배포됩니다. 자유롭게 수정 및 배포가 가능합니다.

---
Created by [leesk1283-github](https://github.com/leesk1283-github)
