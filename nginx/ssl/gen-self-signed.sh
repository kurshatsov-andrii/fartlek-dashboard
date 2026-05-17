#!/usr/bin/env sh
set -euf

cd "$(CDPATH="" cd "$(dirname "$0")" && pwd)"

# Для браузера: перевизначте SSL_CERT_CN=your.domain (SAN — openssl.cnf або Let's Encrypt / certbot).
# MSYS2_ARG_CONV_EXCL: Git Bash не перетворює `-subj` на Windows-шлях.
OPENSSL_SUBJ="/CN=${SSL_CERT_CN:-localhost}/O=Fartlek/OU=Docker"

MSYS2_ARG_CONV_EXCL='*' openssl req -x509 -nodes -newkey rsa:2048 \
  -days 825 \
  -keyout privkey.pem \
  -out fullchain.pem \
  -subj "${OPENSSL_SUBJ}"

chmod 644 fullchain.pem
chmod 600 privkey.pem

echo "Створено: $(pwd)/fullchain.pem та $(pwd)/privkey.pem"
