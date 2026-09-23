FROM ghcr.io/esphome/esphome:latest

# Instalar librerías necesarias para el compilador RISC-V
# Use paquetes disponibles en Debian modernos (metapaquetes de desarrollo)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libncurses-dev \
    zlib1g-dev \
    libffi-dev \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
