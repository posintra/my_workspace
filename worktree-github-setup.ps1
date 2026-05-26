$ErrorActionPreference = "Stop"

# Worktree GitHub Auth Setup (PAT via env var only)
# Required env var: GITHUB_TOKEN

$GitUserName = "posintra"
$GitUserEmail = "posintra7@gmail.com"
$RepoHttpsUrl = "https://github.com/posintra/my_workspace.git"

Write-Host "[1/6] Git 사용자 정보 설정"
git config --global user.name $GitUserName
git config --global user.email $GitUserEmail

Write-Host "[2/6] HTTPS + Credential Manager 설정"
git config --global credential.helper manager-core
git config --global credential.https://github.com.useHttpPath true

Write-Host "[3/6] GITHUB_TOKEN 환경변수 확인"
if ([string]::IsNullOrWhiteSpace($env:GITHUB_TOKEN)) {
    throw "GITHUB_TOKEN 환경변수가 비어 있습니다. 자동화 시크릿/환경변수에 PAT를 주입하세요."
}

Write-Host "[4/6] 원격 저장소(origin) 설정/보정"
$hasOrigin = $true
try {
    git remote get-url origin | Out-Null
} catch {
    $hasOrigin = $false
}

if ($hasOrigin) {
    git remote set-url origin $RepoHttpsUrl
    Write-Host "origin URL을 HTTPS로 변경: $RepoHttpsUrl"
} else {
    git remote add origin $RepoHttpsUrl
    Write-Host "origin 추가: $RepoHttpsUrl"
}

Write-Host "[5/6] PAT를 헤더로 사용한 원격 접근 확인(ls-remote)"
$authHeader = "AUTHORIZATION: basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$($env:GITHUB_TOKEN)"))
git -c http.https://github.com/.extraheader="$authHeader" ls-remote $RepoHttpsUrl | Out-Null

Write-Host "[6/6] 설정 완료"
Write-Host "완료: PAT 환경변수 기반 GitHub 인증 설정이 끝났습니다."

