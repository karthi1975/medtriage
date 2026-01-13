#!/bin/bash
# HAPI FHIR Compute Engine VM Setup Script
# This script sets up everything needed on the VM

set -e

echo "======================================"
echo "HAPI FHIR VM Setup - Starting"
echo "======================================"

# Update system
echo "1. Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Docker
echo "2. Installing Docker..."
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose standalone
echo "3. Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Cloud SQL Proxy
echo "4. Installing Cloud SQL Proxy..."
curl -o /tmp/cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.2/cloud-sql-proxy.linux.amd64
sudo mv /tmp/cloud-sql-proxy /usr/local/bin/cloud-sql-proxy
sudo chmod +x /usr/local/bin/cloud-sql-proxy

# Create directories
echo "5. Creating application directories..."
sudo mkdir -p /opt/hapi-fhir
sudo chown $USER:$USER /opt/hapi-fhir

# Create docker-compose.yml
echo "6. Creating docker-compose configuration..."
cat > /opt/hapi-fhir/docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Cloud SQL Proxy
  cloud-sql-proxy:
    image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:latest
    container_name: cloud-sql-proxy
    command:
      - "--port=5432"
      - "project-c78515e0-ee8f-4282-a3c:us-east5:medichat-postgres"
    ports:
      - "5432:5432"
    restart: always
    networks:
      - hapi-network

  # HAPI FHIR Server
  hapi-fhir:
    image: hapiproject/hapi:latest
    container_name: hapi-fhir
    ports:
      - "8080:8080"
    environment:
      # Database configuration
      spring.datasource.url: 'jdbc:postgresql://cloud-sql-proxy:5432/hapi'
      spring.datasource.username: 'hapiuser'
      spring.datasource.password: 'HapiSecure2026!'
      spring.datasource.driverClassName: 'org.postgresql.Driver'

      # Hibernate configuration
      spring.jpa.properties.hibernate.dialect: 'ca.uhn.fhir.jpa.model.dialect.HapiFhirPostgres94Dialect'
      spring.jpa.hibernate.ddl-auto: 'update'

      # HAPI FHIR configuration
      hapi.fhir.allow_external_references: 'true'
      hapi.fhir.allow_multiple_delete: 'false'
      hapi.fhir.allow_contains_searches: 'true'
      hapi.fhir.allow_override_default_search_params: 'true'
      hapi.fhir.auto_create_placeholder_reference_targets: 'true'
      hapi.fhir.default_encoding: 'JSON'
      hapi.fhir.default_pretty_print: 'true'
      hapi.fhir.fhir_version: 'R4'

      # Server configuration
      server.port: '8080'

      # Performance tuning
      spring.datasource.hikari.maximum-pool-size: '10'
      spring.datasource.hikari.minimum-idle: '2'

    depends_on:
      - cloud-sql-proxy
    restart: always
    networks:
      - hapi-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/fhir/metadata"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s

networks:
  hapi-network:
    driver: bridge

EOF

# Create systemd service for auto-start
echo "7. Creating systemd service..."
sudo cat > /etc/systemd/system/hapi-fhir.service << 'EOF'
[Unit]
Description=HAPI FHIR Server
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/hapi-fhir
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Start HAPI FHIR: cd /opt/hapi-fhir && docker-compose up -d"
echo "2. Check logs: docker-compose logs -f hapi-fhir"
echo "3. Test endpoint: curl http://localhost:8080/fhir/metadata"
echo ""
echo "To enable auto-start on boot:"
echo "sudo systemctl enable hapi-fhir"
echo "sudo systemctl start hapi-fhir"
echo ""
