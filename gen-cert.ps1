# gen-cert.ps1

# mkcert 경로 (환경변수 등록 안했으면 직접 경로 지정)
$mkcert = "C:\mkcert\mkcert.exe"

if (-Not (Test-Path $mkcert)) {
    Write-Error "mkcert.exe가 $mkcert 경로에 없습니다. 설치 후 경로를 확인하세요."
    exit 1
}

# 루트 CA 설치 (최초 1회)
& $mkcert -install

# 인증서 생성
New-Item -ItemType Directory -Force -Path "./nginx" | Out-Null
& $mkcert -key-file "./nginx/localhost.key" -cert-file "./nginx/localhost.crt" localhost

Write-Host "certification generated on ./nginx"