# PowerShell 스크립트 실행 가이드

## ⚠️ PowerShell 실행 정책 오류 해결

PowerShell에서 스크립트를 실행할 때 다음과 같은 오류가 발생할 수 있습니다:
```
.\deploy.ps1 : 이 시스템에서 스크립트를 실행할 수 없으므로 ... 파일을 로드할 수 없습니다.
```

### 해결 방법 1: 현재 세션에서만 허용 (권장)

PowerShell을 **관리자 권한**으로 실행한 후:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

이 방법은 현재 PowerShell 창에서만 스크립트 실행을 허용합니다.

### 해결 방법 2: 현재 사용자에게 영구 허용

PowerShell을 **관리자 권한**으로 실행한 후:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

이 방법은 현재 사용자 계정에서 항상 스크립트 실행을 허용합니다.

### 해결 방법 3: 우회 실행 (임시)

관리자 권한 없이 일회성으로 실행:
```powershell
PowerShell -ExecutionPolicy Bypass -File .\deploy.ps1
```

---

## 🚀 스크립트 실행 방법

### 방법 1: PowerShell에서 직접 실행
```powershell
# 1. PowerShell 열기 (관리자 권한 권장)

# 2. 프로젝트 디렉토리로 이동
cd C:\path\to\superset-vue-project

# 3. 실행 정책 설정 (최초 1회)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 4. 배포 스크립트 실행
.\deploy.ps1

# 또는 테스트 스크립트
.\test-chatbot.ps1

# 또는 로그 모니터링
.\logs.ps1
```

### 방법 2: 배치 파일 사용 (더 간단)

배치 파일(.bat)은 실행 정책 문제가 없습니다:
```cmd
# 간단 시작
start.bat

# 중지
stop.bat

# 또는 전체 배포 (이전에 만든 파일)
deploy.bat
```

### 방법 3: 우클릭 메뉴에서 실행

1. `.ps1` 파일 우클릭
2. "PowerShell에서 실행" 선택

---

## 📋 권장 워크플로우

### 최초 설정 (1회만)
```powershell
# PowerShell 관리자 권한으로 실행
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 일상 사용
```powershell
# 배포
.\deploy.ps1

# 테스트
.\test-chatbot.ps1

# 로그 확인
.\logs.ps1
```

또는 더 간단하게:
```cmd
start.bat    # 시작
stop.bat     # 중지
```

---

## 🔍 실행 정책 확인

현재 실행 정책 확인:
```powershell
Get-ExecutionPolicy -List
```

출력 예시:
```
Scope          ExecutionPolicy
-----          ---------------
MachinePolicy  Undefined
UserPolicy     Undefined
Process        Undefined
CurrentUser    RemoteSigned
LocalMachine   Undefined
```

---

## ❓ 실행 정책이란?

PowerShell 실행 정책은 보안 기능으로, 악의적인 스크립트 실행을 방지합니다.

- **Restricted**: 스크립트 실행 불가 (기본값)
- **RemoteSigned**: 로컬 스크립트는 실행 가능, 다운로드한 스크립트는 서명 필요
- **Unrestricted**: 모든 스크립트 실행 가능 (권장하지 않음)
- **Bypass**: 모든 제한 우회 (임시 사용만)

---

## 🛡️ 보안 참고

- **RemoteSigned**가 가장 안전하면서도 실용적인 옵션입니다
- **Unrestricted**는 사용하지 마세요
- 신뢰할 수 있는 스크립트만 실행하세요