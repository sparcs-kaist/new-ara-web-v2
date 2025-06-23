#!/bin/bash
set -e

# OS 정보
OS="$(uname -s)"

case "$OS" in
    Darwin)
        echo "macOS detected"
        INSTALL_CMD="brew install mkcert"
        ;;
    Linux)
        echo "Linux detected"
        INSTALL_CMD="sudo apt install libnss3-tools && curl -JLO https://dl.filippo.io/mkcert/latest?for=linux && sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert && sudo chmod +x /usr/local/bin/mkcert"
        ;;
    *)
        echo "Unsupported OS: $OS"
        exit 1
        ;;
esac

# mkcert 존재 확인
if ! command -v mkcert &> /dev/null; then
    echo "mkcert is not installed."
    echo "설치 명령:"
    echo "$INSTALL_CMD"
    exit 1
fi

# 루트 CA 설치 (최초 1회만)
echo "루트 CA 설치 중..."
mkcert -install

# 인증서 생성
mkdir -p ./nginx
mkcert -key-file ./nginx/localhost.key -cert-file ./nginx/localhost.crt localhost

echo "인증서가 ./nginx 디렉토리에 생성되었습니다."