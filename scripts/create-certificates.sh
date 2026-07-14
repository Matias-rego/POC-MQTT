#!/usr/bin/env bash

set -euo pipefail

########################################
# Configuration
########################################

HOST="${1:-localhost}"

CA_DIAS=3650
SERVER_DIAS=825

OUTDIR="../data/mosquitto/config/certs"

mkdir -p "$OUTDIR"
cd "$OUTDIR"

echo "========================================="
echo " MQTT Certificate Generator"
echo "========================================="
echo "Broker: $HOST"
echo

########################################
# Detect if HOST is an IP
########################################

if [[ "$HOST" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    SAN="IP.1=$HOST"
    echo "Mode: IP Address"
else
    SAN="DNS.1=$HOST"
    echo "Mode: Domain name/host"
fi

########################################
# Create CA
########################################

echo
echo "[1/5] Creating Certificate Authority..."

openssl genrsa -out ca.key 4096

openssl req \
    -x509 \
    -new \
    -nodes \
    -key ca.key \
    -sha256 \
    -days $CA_DIAS \
    -subj "/C=AR/ST=Santa Fe/L=Casilda/O=MQTT/OU=CA/CN=MQTT Local CA" \
    -out ca.crt

########################################
# Create server key
########################################

echo
echo "[2/5] Generating broker private key..."

openssl genrsa \
    -out server.key \
    2048

########################################
# Extensions file
########################################

echo
echo "[3/5] Generating extensions..."

cat > server.ext <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=@alt_names

[alt_names]
$SAN
DNS.2=localhost
IP.2=127.0.0.1
EOF

########################################
# CSR (Certificate Signing Request)
########################################

echo
echo "[4/5] Generating CSR..."

openssl req \
    -new \
    -key server.key \
    -subj "/C=AR/ST=Santa Fe/L=Casilda/O=MQTT/OU=Broker/CN=$HOST" \
    -out server.csr

########################################
# Sign certificate
########################################

echo
echo "[5/5] Signing certificate..."

openssl x509 \
    -req \
    -in server.csr \
    -CA ca.crt \
    -CAkey ca.key \
    -CAcreateserial \
    -out server.crt \
    -days $SERVER_DIAS \
    -sha256 \
    -extfile server.ext

########################################
# Cleanup
########################################

rm -f server.csr
rm -f server.ext
rm -f ca.srl

########################################
# Permissions
########################################

chmod 600 ca.key
chmod 600 server.key

chmod 644 ca.crt
chmod 644 server.crt

########################################
# Information
########################################

echo
echo "========================================="
echo " Certificates created successfully"
echo "========================================="

echo
openssl x509 -in server.crt -text -noout | grep -A2 "Subject Alternative Name"

echo
ls -lh

