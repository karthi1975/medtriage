# EC2 Deployment Guide for MediChat

Complete step-by-step guide to deploy both frontend and backend on AWS EC2.

## Prerequisites

- AWS EC2 instance (Ubuntu/Amazon Linux)
- Docker and Docker Compose installed on EC2
- Security Group configured
- EC2 public IP address

---

## Part 1: AWS Security Group Configuration

### Required Inbound Rules

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| HTTP | TCP | 80 | 0.0.0.0/0 | Frontend access |
| Custom TCP | TCP | 8002 | 0.0.0.0/0 | Backend API (optional - for direct access) |
| SSH | TCP | 22 | Your IP | SSH access |

**Steps:**
1. AWS Console → EC2 → Instances
2. Select your instance → Security tab
3. Click on Security Group link
4. Edit Inbound Rules → Add rules above
5. Save rules

---

## Part 2: Upload Files to EC2

### Option A: Using Git (Recommended)

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@3.149.33.232

# Clone or pull your repository
git clone https://github.gatech.edu/kjeyabalan3/medichat.git
cd medichat

# Or if already cloned, pull latest changes
git pull origin main
```

### Option B: Using SCP

```bash
# From your local machine
scp -i your-key.pem -r /path/to/project ec2-user@3.149.33.232:~/medichat
```

---

## Part 3: EC2 Server Setup

### 1. SSH into EC2

```bash
ssh -i your-key.pem ec2-user@3.149.33.232
```

### 2. Install Docker (if not installed)

```bash
# Update system
sudo yum update -y  # For Amazon Linux
# OR
sudo apt update && sudo apt upgrade -y  # For Ubuntu

# Install Docker
sudo yum install docker -y  # Amazon Linux
# OR
sudo apt install docker.io -y  # Ubuntu

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group (avoid using sudo)
sudo usermod -aG docker $USER

# Log out and log back in for group changes to take effect
exit
ssh -i your-key.pem ec2-user@3.149.33.232
```

### 3. Install Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

---

## Part 4: Configure Environment Variables

### 1. Navigate to project directory

```bash
cd ~/medichat  # or wherever you uploaded/cloned the project
```

### 2. Create .env file

```bash
cat > .env << 'EOF'
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# FHIR Server Configuration
FHIR_SERVER_URL=http://3.149.33.232:8081/fhir

# Chat Configuration
CHAT_HISTORY_LIMIT=10
MAX_TOKENS=1500
TEMPERATURE=0.7
TOP_P=1.0
FREQUENCY_PENALTY=0.0
PRESENCE_PENALTY=0.0

# RAG Configuration
USE_RAG=true
EOF
```

### 3. Edit the .env file to add your real OpenAI API key

```bash
nano .env
# Replace 'your_openai_api_key_here' with your actual key
# Press CTRL+X, then Y, then Enter to save
```

---

## Part 5: Build and Deploy

### 1. Stop any running containers

```bash
docker-compose down
```

### 2. Build the containers

```bash
# Build both frontend and backend
docker-compose build --no-cache
```

This will:
- Build the Python backend (FastAPI)
- Build the React frontend
- Create optimized production builds
- Set up nginx reverse proxy

### 3. Start the containers

```bash
# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Verify containers are running

```bash
docker-compose ps
```

Expected output:
```
NAME                  STATUS        PORTS
fhir-chat-api         Up (healthy)  0.0.0.0:8002->8000/tcp
fhir-chat-frontend    Up (healthy)  0.0.0.0:80->80/tcp
```

---

## Part 6: Verification & Testing

### 1. Get your EC2 Public IP

```bash
curl http://checkip.amazonaws.com
```

Let's say it returns: `3.149.33.232`

### 2. Test Backend API

```bash
# From EC2 instance
curl http://localhost:8002/health

# From your local machine
curl http://3.149.33.232:8002/health
```

Expected response:
```json
{"status":"healthy","service":"FHIR Chat API","version":"1.0.0"}
```

### 3. Test Frontend

Open in your web browser:
```
http://3.149.33.232/
```

You should see the MediChat interface.

### 4. Test API through nginx proxy

```bash
# From your local machine
curl http://3.149.33.232/health
curl http://3.149.33.232/api/v1/patients/13
```

### 5. Test Complete Flow

1. Open browser: `http://3.149.33.232`
2. Enter Patient ID: `13`
3. Type a symptom: "I have chest pain"
4. Click Send
5. Should see triage results with patient info

---

## Part 7: Monitoring & Maintenance

### View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f fhir-chat-api

# Frontend only
docker-compose logs -f fhir-chat-frontend

# Last 100 lines
docker-compose logs --tail=100
```

### Restart Services

```bash
# Restart both
docker-compose restart

# Restart backend only
docker-compose restart fhir-chat-api

# Restart frontend only
docker-compose restart fhir-chat-frontend
```

### Update Code

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Or for specific service
docker-compose up -d --build fhir-chat-api
```

### Check Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Clean up unused images
docker system prune -a
```

---

## Part 8: Troubleshooting

### Issue: Can't access from browser

**Check:**
1. Security Group has port 80 open
2. Containers are running: `docker-compose ps`
3. No firewall blocking: `sudo iptables -L`

**Fix:**
```bash
# Check if port 80 is listening
sudo netstat -tlnp | grep :80

# Restart containers
docker-compose restart
```

### Issue: Frontend shows but API calls fail

**Check nginx logs:**
```bash
docker-compose logs fhir-chat-frontend | grep error
```

**Check backend is reachable:**
```bash
docker-compose exec fhir-chat-frontend wget -O- http://fhir-chat-api:8000/health
```

### Issue: Backend container crashes

**Check logs:**
```bash
docker-compose logs fhir-chat-api
```

**Common causes:**
- Missing OPENAI_API_KEY in .env
- Invalid FHIR_SERVER_URL
- Port 8000 already in use

**Fix:**
```bash
# Verify .env file
cat .env

# Check if port is in use
sudo netstat -tlnp | grep :8000

# Rebuild
docker-compose down
docker-compose up -d --build
```

### Issue: "Permission denied" errors

**Fix:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in
exit
ssh -i your-key.pem ec2-user@3.149.33.232
```

### Issue: Out of disk space

**Check:**
```bash
df -h
docker system df
```

**Clean up:**
```bash
# Remove unused containers, networks, images
docker system prune -a

# Remove specific images
docker images
docker rmi <image-id>
```

---

## Architecture Overview

```
Internet
    │
    ▼
EC2 Security Group (Port 80)
    │
    ▼
nginx (Container - Port 80)
    ├─► /api/* → Backend (Port 8000)
    └─► /* → Static React Files
    │
    ▼
FastAPI Backend (Container - Port 8000)
    │
    ├─► OpenAI API
    └─► FHIR Server (3.149.33.232:8081)
```

**Key Points:**
- Nginx acts as reverse proxy
- Frontend and backend in same Docker network
- Only port 80 needs to be publicly accessible
- API calls from browser go through nginx proxy
- No CORS issues because same origin

---

## Production Optimizations (Optional)

### 1. Use HTTPS with SSL Certificate

```bash
# Install certbot
sudo yum install certbot python3-certbot-nginx -y

# Get certificate (requires domain name)
sudo certbot --nginx -d yourdomain.com
```

### 2. Set up Auto-start on Reboot

```bash
# Add to crontab
crontab -e

# Add this line:
@reboot cd /home/ec2-user/medichat && docker-compose up -d
```

### 3. Enable Logging

Update docker-compose.yml:
```yaml
services:
  fhir-chat-api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## Quick Commands Reference

| Task | Command |
|------|---------|
| Start all services | `docker-compose up -d` |
| Stop all services | `docker-compose down` |
| View logs | `docker-compose logs -f` |
| Restart services | `docker-compose restart` |
| Rebuild and start | `docker-compose up -d --build` |
| Check status | `docker-compose ps` |
| Execute command in container | `docker-compose exec fhir-chat-api bash` |
| View resource usage | `docker stats` |

---

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- View API docs: `http://YOUR_EC2_IP/docs`
- Test health: `curl http://YOUR_EC2_IP/health`
- Contact: kjeyabalan3@gatech.edu

---

## Summary Checklist

- [ ] EC2 Security Group has port 80 open
- [ ] Docker and Docker Compose installed
- [ ] Code uploaded to EC2 (via git or scp)
- [ ] .env file created with OPENAI_API_KEY
- [ ] Containers built: `docker-compose build`
- [ ] Containers running: `docker-compose up -d`
- [ ] Backend health check works: `curl http://localhost:8002/health`
- [ ] Frontend accessible: `http://YOUR_EC2_IP/`
- [ ] Can perform triage with patient data
