#!/usr/bin/env bash
set -euo pipefail

if ! command -v age-keygen >/dev/null 2>&1; then
  echo "age-keygen not found. Install age: https://github.com/FiloSottile/age/releases" >&2
  exit 1
fi

OUT_DIR="${1:-./secrets}"
mkdir -p "${OUT_DIR}"

KEY_PATH="${OUT_DIR}/age.key"
PUB_PATH="${OUT_DIR}/age.pub"

echo "Generating age keypair in ${OUT_DIR}..."
age-keygen -o "${KEY_PATH}"
age-keygen -y "${KEY_PATH}" > "${PUB_PATH}"

echo "Private key: ${KEY_PATH}"
echo "Public key : ${PUB_PATH}"
echo "Keep the private key offline; distribute the public key to collectors."
