$ErrorActionPreference = "Stop"

# =========================================================
# Worktree GitHub Auth Setup Template (PowerShell)
# ---------------------------------------------------------
# 사용법:
# 1) 아래 placeholder 값을 본인 환경에 맞게 수정
# 2) Codex automation의 localEnvironmentConfigPath에서 이 파일 실행
# =========================================================

# [필수] 본인 GitHub 정보
$GitUserName = "posintra"
$GitUserEmail = "positnra7@gmail.com"

# [필수] SSH 개인키 경로 (예: C:\Users\<you>\.ssh\id_ed25519)
$SshPrivateKeyPath = "C:\Users\YOUR_USER\.ssh\id_ed25519"

# [선택] 대상 리포 (origin이 없을 때만 추가됨)
$RepoSshUrl = "git@github.com:YOUR_ID/YOUR_REPO.git"

Write-Host "[1/6] Git 사용자 정보 설정"
git config --global user.name $GitUserName
git config --global user.email $GitUserEmail

Write-Host "[2/6] .ssh 폴더 준비"
$SshDir = Join-Path $HOME ".ssh"
if (-not (Test-Path $SshDir)) {
    New-Item -ItemType Directory -Path $SshDir | Out-Null
}

Write-Host "[3/6] github.com known_hosts 등록"
$KnownHosts = Join-Path $SshDir "known_hosts"
if (-not (Test-Path $KnownHosts)) {
    New-Item -ItemType File -Path $KnownHosts | Out-Null
}
if (-not (Select-String -Path $KnownHosts -Pattern "github.com" -SimpleMatch -Quiet -ErrorAction SilentlyContinue)) {
    ssh-keyscan github.com | Out-File -FilePath $KnownHosts -Encoding ascii -Append
}

Write-Host "[4/6] ssh-agent 준비 및 키 등록"
$agentStatus = Get-Service ssh-agent -ErrorAction SilentlyContinue
if ($null -eq $agentStatus) {
    throw "ssh-agent 서비스를 찾을 수 없습니다. OpenSSH Client 설치 여부를 확인하세요."
}
if ($agentStatus.Status -ne "Running") {
    Start-Service ssh-agent
}

if (-not (Test-Path $SshPrivateKeyPath)) {
    throw "SSH 개인키를 찾지 못했습니다: $SshPrivateKeyPath"
}

try {
    ssh-add $SshPrivateKeyPath | Out-Null
} catch {
    Write-Warning "ssh-add 중 경고가 발생했습니다. 이미 등록된 키일 수 있습니다."
}

Write-Host "[5/6] GitHub 연결 테스트"
ssh -T git@github.com

Write-Host "[6/6] 원격 저장소(origin) 설정/보정"
$hasOrigin = $true
try {
    git remote get-url origin | Out-Null
} catch {
    $hasOrigin = $false
}

if ($hasOrigin) {
    git remote set-url origin $RepoSshUrl
    Write-Host "origin URL을 SSH로 변경: $RepoSshUrl"
} else {
    git remote add origin $RepoSshUrl
    Write-Host "origin 추가: $RepoSshUrl"
}

Write-Host ""
Write-Host "완료: worktree 자동화에서 개인 GitHub 인증 템플릿 적용이 끝났습니다."

