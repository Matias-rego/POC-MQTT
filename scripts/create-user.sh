#!/usr/bin/env bash

set -euo pipefail

########################################
# Configuration
########################################

OUTDIR="../data/mosquitto/config/"

mkdir -p "$OUTDIR"
cd "$OUTDIR"

PASSWD_FILE="passwd"

########################################
# Validations
########################################

if [ $# -ne 1 ]; then
    echo "Usage:"
    echo "  $0 <user>"
    exit 1
fi

USER="$1"

mkdir -p "$(dirname "$PASSWD_FILE")"

if [ ! -f "$PASSWD_FILE" ]; then
    touch "$PASSWD_FILE"
fi

########################################
# Create or update user
########################################

echo
echo "===================================="
echo " User: $USER"
echo "===================================="

docker run --rm \
    --user 1000:1000 \
    -it \
    -v "$(pwd):/mosquitto/config" \
    eclipse-mosquitto:2 \
    mosquitto_passwd \
    /mosquitto/config/passwd \
    "$USER"

rm -f "$(dirname "$PASSWD_FILE")"/passwd.backup.*

echo
echo "User created or updated successfully."
