@echo off
echo Checking mkcert...
where mkcert >nul 2>nul
if errorlevel 1 (
  echo mkcert is not installed.
  echo Please install it from https://github.com/FiloSottile/mkcert
  exit /b 1
)

if not exist nginx mkdir nginx

echo Generating certificate...
mkcert -key-file nginx\localhost.key -cert-file nginx\localhost.crt localhost

echo Done. Certs saved in nginx\