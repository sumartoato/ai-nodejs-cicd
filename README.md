# AI Node.js CI/CD

[![CI Pipeline](https://github.com/sumartoato/ai-nodejs-cicd/actions/workflows/ci.yml/badge.svg)](https://github.com/sumartoato/ai-nodejs-cicd/actions/workflows/ci.yml)
[![CD Staging](https://github.com/sumartoato/ai-nodejs-cicd/actions/workflows/cd-staging.yml/badge.svg)](https://github.com/sumartoato/ai-nodejs-cicd/actions/workflows/cd-staging.yml)
[![CD Production](https://github.com/sumartoato/ai-nodejs-cicd/actions/workflows/cd-production.yml/badge.svg)](https://github.com/sumartoato/ai-nodejs-cicd/actions/workflows/cd-production.yml)

Aplikasi **Node.js** sederhana dengan **Express.js**, **JWT Authentication**, **MariaDB (Sequelize)**, **Redis**, dan pipeline **CI/CD lengkap** menggunakan GitHub Actions — dirancang sebagai proyek demonstrasi alur devops dari nol hingga production.

---

## Daftar Isi

- [Arsitektur Aplikasi](#arsitektur-aplikasi)
- [Struktur Proyek](#struktur-proyek)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Setup & Instalasi](#setup--instalasi)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Konfigurasi Environment](#2-konfigurasi-environment)
  - [3. Install Dependencies](#3-install-dependencies)
  - [4. Setup Database](#4-setup-database)
  - [5. Setup Redis (Opsional)](#5-setup-redis-opsional)
  - [6. Seed Database (Data Testing)](#6-seed-database-data-testing)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
  - [Development Mode](#development-mode)
  - [Production Mode](#production-mode)
  - [Docker](#docker)
  - [PM2 Cluster Mode](#pm2-cluster-mode)
- [Testing](#testing)
  - [Unit & Integration Tests](#unit--integration-tests)
  - [Test Coverage](#test-coverage)
  - [Test Run di CI](#test-run-di-ci)
- [API Documentation](#api-documentation)
  - [Endpoints](#endpoints)
  - [Contoh Request](#contoh-request)
- [CI/CD Pipeline](#cicd-pipeline)
  - [Workflow CI (ci.yml)](#workflow-ci-ciyml)
  - [Workflow CD Staging (cd-staging.yml)](#workflow-cd-staging-cd-stagingyml)
  - [Workflow CD Production (cd-production.yml)](#workflow-cd-production-cd-productionyml)
  - [Setup Secrets GitHub](#setup-secrets-github)
- [Deployment](#deployment)
  - [Deploy ke VPS Manual](#deploy-ke-vps-manual)
  - [Deploy via CI/CD Otomatis](#deploy-via-cicd-otomatis)
- [Maintenance](#maintenance)
  - [Logging & Monitoring](#logging--monitoring)
  - [Backup Database](#backup-database)
  - [Update Dependencies](#update-dependencies)
  - [Rotasi JWT Secret](#rotasi-jwt-secret)
  - [Health Check](#health-check)
- [Troubleshooting](#troubleshooting)
- [Lisensi](#lisensi)

---

## Arsitektur Aplikasi

```
                        ┌─────────────┐
                        │   Client    │
                        │(Postman/Browser)│
                        └──────┬──────┘
                               │ HTTP/HTTPS
                               ▼
                    ┌──────────────────┐
                    │   Nginx / LB     │  (production)
                    └──────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │   Express App    │  (PM2 Cluster — multi-core)
                    │   Port 3000      │
                    └────┬──────┬──────┘
                         │      │
                    ┌────▼──┐ ┌─▼──────┐
                    │ MariaDB │ │ Redis  │
                    │(Data) │ │(Cache) │
                    └───────┘ └────────┘
```

### Alur Request

1. **Request** masuk ke Express server
2. **Middleware** memproses: helmet (security) → cors → rate limiter → compression → morgan (logging) → body parser
3. **Auth middleware** memverifikasi JWT token (jika route protected)
4. **Validation middleware** memvalidasi body request dengan Joi
5. **Controller** memanggil **Service** layer (business logic)
6. **Service** menggunakan **Repository** layer (data access) yang memanggil **Model** (Sequelize ORM)
7. **Redis** digunakan sebagai cache untuk user profile
8. **Response** dikembalikan dalam format standar via `utils/response.js`

---

## Struktur Proyek

```
ai-nodejs-cicd/
│
├── .github/
│   └── workflows/              # GitHub Actions pipeline
│       ├── ci.yml              #   Lint → Test → Build
│       ├── cd-staging.yml      #   Deploy ke staging
│       └── cd-production.yml   #   Deploy ke production
│
├── src/
│   ├── config/                 # Konfigurasi aplikasi
│   │   ├── database.js         #   Koneksi & sync MariaDB via Sequelize
│   │   ├── redis.js            #   Koneksi & helper Redis (ioredis)
│   │   └── logger.js           #   Winston logger (file + console)
│   │
│   ├── controllers/            # Route handlers
│   │   ├── auth.controller.js  #   register, login
│   │   └── user.controller.js  #   getProfile, getAll, getById
│   │
│   ├── middleware/             # Express middleware
│   │   ├── auth.js             #   JWT authenticate & role authorize
│   │   ├── errorHandler.js     #   Global error handler & 404
│   │   ├── validation.js       #   Joi validation middleware
│   │   └── logger.js           #   Morgan HTTP logger
│   │
│   ├── models/
│   │   └── User.js             # Sequelize User model (UUID PK)
│   │
│   ├── routes/
│   │   ├── auth.routes.js      # POST /register, /login
│   │   └── user.routes.js      # GET /me, /, /:id (admin)
│   │
│   ├── services/
│   │   └── auth.service.js     # register, login, getProfile (business logic)
│   │
│   ├── repository/             # Data access layer (Repository Pattern)
│   │   └── user.repository.js  # CRUD operations for User
│   │
│   ├── utils/
│   │   ├── response.js         # Standard API response helpers
│   │   └── jwt.js              # JWT generate & verify
│   │
│   ├── validators/
│   │   └── auth.validator.js   # Joi schemas (register, login)
│   │
│   ├── app.js                  # Express app setup & middleware stack
│   └── server.js               # Entry point — server startup
│
├── test/
│   └── auth.test.js            # Jest + Supertest integration tests
│
├── logs/                       # Log files (gitignored)
│
├── .github/workflows/          # CI/CD pipeline files
├── Dockerfile                  # Multi-stage Docker build
├── docker-compose.yml          # App + MariaDB + Redis services
├── ecosystem.config.js         # PM2 cluster mode config
├── .env.example               # Template environment variables
├── .gitignore
├── package.json
├── README.md                   # → Dokumentasi ini
└── swagger.yaml                # OpenAPI 3.0 spec
```

### Pola Arsitektur: Repository Pattern

Aplikasi ini menggunakan **Repository Pattern** — memisahkan logic bisnis (service) dari akses data (repository):

```
Controller → Service → Repository → Model (Sequelize) → Database
```

**Keuntungan:**
- **Separation of concerns** — service tidak tahu cara query database
- **Testability** — repository bisa di-mock saat unit test
- **Flexibility** — ganti ORM atau database tanpa mengubah service

---

## Persyaratan Sistem

| Komponen | Minimal | Recommended |
|----------|---------|-------------|
| Node.js | 18.x | 20.x LTS |
| MariaDB | 10.6 | 11.4+ |
| Redis | 5.x | 7.x |
| NPM | 9.x | 10.x |
| RAM | 512 MB | 1 GB+ |
| Disk | 500 MB | 1 GB |

---

## Setup & Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/sumartoato/ai-nodejs-cicd.git
cd ai-nodejs-cicd
```

### 2. Konfigurasi Environment

```bash
cp .env.example .env
```

Edit file `.env` sesuai environment Anda:

```env
# ── Server ──
PORT=3000
NODE_ENV=development

# ── Database (MariaDB) ──
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=nodejs_cicd

# ── Redis ──
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ── JWT ──
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── Logging ──
LOG_LEVEL=debug
LOG_FILE=logs/app.log
```

> **⚠️ PENTING:** Ganti `JWT_SECRET` dengan string acak yang kuat di production!
> Gunakan perintah: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 3. Install Dependencies

```bash
npm install
```

### 4. Setup Database

Buat database MariaDB:

```bash
mariadb -u root -p -e "CREATE DATABASE IF NOT EXISTS nodejs_cicd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Atau via Docker:

```bash
docker run -d --name mariadb-cicd \
  -e MARIADB_ROOT_PASSWORD=rootpass \
  -e MARIADB_DATABASE=nodejs_cicd \
  -p 3306:3306 \
  mariadb:11.4
```

Aplikasi akan **auto-sync** model saat pertama kali dijalankan (`alter: true` di mode development).

### 5. Setup Redis (Opsional)

Redis digunakan untuk caching profile user. Tanpa Redis aplikasi tetap berjalan, hanya tanpa cache.

```bash
# Via Docker
docker run -d --name redis-cicd -p 6379:6379 redis:7-alpine

# Atau via apt (Ubuntu)
sudo apt install redis-server
sudo systemctl start redis
```

### 6. Seed Database (Data Testing)

Setelah database siap, jalankan seeder untuk mengisi data user testing:

```bash
# Seed semua user test
npm run seed
```

Output:
```
Database connection established successfully
Database models synced
Menambahkan 4 user test...
  ✅ admin@test.com (admin)
  ✅ john@test.com (user)
  ✅ jane@test.com (user)
  ✅ bob@test.com (user)

✨ Seed selesai! 4 user baru ditambahkan

📋 Test Credentials:
   Admin : admin@test.com / Admin123
   User  : john@test.com / User1234
   User  : jane@test.com / User1234
   User  : bob@test.com  / User1234
```

**Perintah seed lainnya:**

| Perintah | Deskripsi |
|----------|-----------|
| `npm run seed` | Tambah user test (skip yang sudah ada) |
| `npm run seed:drop` | Hapus semua user dulu, lalu seed ulang |
| `node src/seed.js --help` | Lihat bantuan CLI |

**Test Credentials yang tersedia:**

| Nama | Email | Password | Role |
|------|-------|----------|------|
| Admin User | `admin@test.com` | `Admin123` | **admin** |
| John Doe | `john@test.com` | `User1234` | user |
| Jane Smith | `jane@test.com` | `User1234` | user |
| Bob Johnson | `bob@test.com` | `User1234` | user |

> **💡 Tip:** Login sebagai **admin** (`admin@test.com / Admin123`) untuk mengakses endpoint yang membutuhkan role admin seperti `GET /api/v1/users` dan `GET /api/v1/users/:id`.

---

## Menjalankan Aplikasi

### Development Mode

Auto-restart saat ada perubahan file (via nodemon):

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Atau dengan PM2 cluster (multi-core):

```bash
npx pm2 start ecosystem.config.js --env production
npx pm2 logs
npx pm2 monit
```

### Docker

**Build & run semua service (app + MariaDB + Redis):**

```bash
docker compose up -d
```

**Hanya build aplikasi:**

```bash
docker build -t ai-nodejs-cicd .
docker run -p 3000:3000 --env-file .env ai-nodejs-cicd
```

### PM2 Cluster Mode

```bash
# Install PM2 global
npm install -g pm2

# Start cluster (max CPU cores)
pm2 start ecosystem.config.js --env production

# Status
pm2 status

# Restart
pm2 restart ai-nodejs-cicd

# Stop
pm2 stop ai-nodejs-cicd

# Logs
pm2 logs ai-nodejs-cicd

# Save process list for auto-start on reboot
pm2 save
pm2 startup
```

---

## Testing

### Unit & Integration Tests

Framework: **Jest** + **Supertest**

```bash
# Jalankan semua test (sekali)
npm test

# Watch mode (auto-run saat file berubah)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Coverage

```bash
npm run test:coverage
```

Hasil coverage akan tersimpan di folder `coverage/`. Buka `coverage/lcov-report/index.html` untuk laporan interaktif.

### Apa yang di-test?

| Test | Deskripsi |
|------|-----------|
| Health Check | GET /health mengembalikan 200 |
| Register | Validasi body, password strength, error handling |
| Login | Validasi body, error handling |
| Auth Middleware | 401 tanpa token di route protected |
| Protected Routes | GET /users tanpa token → 401 |

### Test Run di CI

Saat pipeline CI berjalan, GitHub Actions akan:
1. Menjalankan service **MariaDB** dan **Redis** sebagai container terpisah
2. Mengatur environment variable test
3. Menjalankan `npm test` dengan koneksi database real

---

## API Documentation

### Endpoints

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|------|------|-----------|
| `GET` | `/health` | ✗ | - | Health check server |
| `POST` | `/api/v1/auth/register` | ✗ | - | Registrasi user baru |
| `POST` | `/api/v1/auth/login` | ✗ | - | Login user |
| `GET` | `/api/v1/users/me` | ✓ | any | Profile user saat ini |
| `GET` | `/api/v1/users` | ✓ | admin | Daftar semua user |
| `GET` | `/api/v1/users/:id` | ✓ | admin | Detail user by ID |
| `GET` | `/api-docs` | ✗ | - | Swagger UI documentation |

### Contoh Request

**Register:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid-xxx",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "timestamp": "2026-07-16T08:00:00.000Z"
}
```

**Login:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

**Akses profile (with JWT):**

```bash
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <accessToken>"
```

**Error response:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "\"name\" is required",
    "\"email\" is required"
  ],
  "timestamp": "2026-07-16T08:00:00.000Z"
}
```

### Swagger UI

Setelah aplikasi berjalan, buka: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## CI/CD Pipeline

Aplikasi ini memiliki **3 workflow GitHub Actions** yang saling terintegrasi:

### CI: Continuous Integration (`ci.yml`)

**Trigger:** Setiap `push` ke `main`/`develop`, atau `pull_request` ke `main`

```mermaid
graph LR
    A[Push/PR] --> B[Lint]
    B --> C[Test]
    C --> D[Build Docker]
```

**Jobs:**
1. **Lint** — memeriksa kode dengan ESLint
2. **Test** — menjalankan Jest test dengan MariaDB & Redis real (GitHub service containers)
3. **Build** — build Docker image dan verifikasi

### CD Staging (`cd-staging.yml`)

**Trigger:** Setiap `push` ke branch `develop`

```mermaid
graph LR
    A[Push develop] --> B[Login GHCR]
    B --> C[Build & Push Image]
    C --> D[Deploy via SSH]
    D --> E[Health Check]
```

**Jobs:**
1. Login ke GitHub Container Registry (`ghcr.io`)
2. Build & push image dengan tag `staging` dan `staging-<sha>`
3. Deploy ke server staging via SSH (appleboy/ssh-action)
4. Health check setelah deploy

### CD Production (`cd-production.yml`)

**Trigger:** Setiap `push` ke `main` atau `tag v*`

```mermaid
graph LR
    A[Push main / tag v*] --> B[Version Gate]
    B --> C[Login GHCR]
    C --> D[Build & Push Image]
    D --> E[Deploy via SSH]
    E --> F[Smoke Test]
    F --> G[GitHub Release]
```

**Jobs:**
1. **Version Gate** — extract versi dari `package.json`
2. Build & push image dengan tag `latest`, `<version>`, dan `<sha>`
3. Deploy ke server production via SSH
4. Smoke test (curl health endpoint)
5. **GitHub Release** otomatis jika trigger dari tag

### Setup Secrets GitHub

Untuk pipeline CD, Anda perlu menambahkan **secrets** di repository Settings → Secrets and variables → Actions:

| Secret | Deskripsi | Contoh |
|--------|-----------|--------|
| `STAGING_HOST` | IP/hostname staging server | `103.xx.xx.xx` |
| `STAGING_USER` | SSH username staging | `deploy` |
| `STAGING_SSH_KEY` | Private key SSH staging | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PROD_HOST` | IP/hostname production server | `api.domain.com` |
| `PROD_USER` | SSH username production | `deploy` |
| `PROD_SSH_KEY` | Private key SSH production | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

**Cara generate SSH key:**

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys  # di server tujuan
cat ~/.ssh/github_actions                                # copy ke GitHub secrets
```

---

## Deployment

### Deploy ke VPS Manual

**1. Setup server (Ubuntu 22.04+):**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# Install MariaDB
sudo apt install -y mariadb-server
sudo mysql_secure_installation

# Install Redis
sudo apt install -y redis-server

# Install PM2
sudo npm install -g pm2

# Install Docker (opsional)
curl -fsSL https://get.docker.com | sudo bash
```

**2. Clone & setup:**

```bash
git clone https://github.com/sumartoato/ai-nodejs-cicd.git /opt/apps/ai-nodejs-cicd
cd /opt/apps/ai-nodejs-cicd
cp .env.example .env
nano .env  # sesuaikan konfigurasi
npm install --production
```

**3. Setup database:**

```bash
sudo mariadb -u root -p -e "CREATE DATABASE IF NOT EXISTS nodejs_cicd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mariadb -u root -p -e "CREATE USER IF NOT EXISTS 'cicd_user'@'localhost' IDENTIFIED BY 'strong_password';"
sudo mariadb -u root -p -e "GRANT ALL PRIVILEGES ON nodejs_cicd.* TO 'cicd_user'@'localhost'; FLUSH PRIVILEGES;"
```

**4. Start dengan PM2:**

```bash
pm2 start ecosystem.config.js --env production
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

**5. Setup Nginx reverse proxy:**

```bash
sudo apt install -y nginx
```

Buat file `/etc/nginx/sites-available/ai-nodejs-cicd`:

```nginx
server {
    listen 80;
    server_name api.domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ai-nodejs-cicd /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**6. SSL dengan Let's Encrypt:**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.domain.com
```

### Deploy via CI/CD Otomatis

1. Push ke branch `develop` → otomatis deploy ke staging
2. Push ke `main` atau tag `v1.0.0` → otomatis deploy ke production
3. GitHub Release dibuat otomatis untuk setiap tag

---

## Maintenance

### Logging & Monitoring

**Log files:**

```bash
# Application logs
tail -f logs/app.log

# Error logs
tail -f logs/error.log

# PM2 logs
pm2 logs ai-nodejs-cicd

# PM2 monitoring dashboard
pm2 monit
```

**Log format (Winston):**

```json
{
  "timestamp": "2026-07-16 08:00:00",
  "level": "info",
  "message": "Server running on port 3000",
  "service": "ai-nodejs-cicd"
}
```

**Resource monitoring:**

```bash
# Real-time
pm2 monit

# Process stats
pm2 show ai-nodejs-cicd

# System stats
htop
```

### Backup Database

**Manual backup:**

```bash
# Backup
mariadb-dump -u root -p nodejs_cicd > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
mariadb -u root -p nodejs_cicd < backup_file.sql
```

**Cron job backup (harian):**

```bash
crontab -e
# Tambahkan:
0 3 * * * mariadb-dump -u root -p'password' nodejs_cicd > /opt/backups/db_$(date +\%Y\%m\%d).sql && gzip /opt/backups/db_$(date +\%Y\%m\%d).sql
```

### Update Dependencies

**Bulanan — cek update:**

```bash
npm outdated
```

**Update patch & minor:**

```bash
npm update
npm test  # pastikan semua test masih pass
```

**Update major (hati-hati):**

```bash
npm install <package>@latest
npm test
```

**Audit keamanan:**

```bash
npm audit
npm audit fix
```

### Rotasi JWT Secret

**Prosedur rotasi secret:**

1. Generate secret baru:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. Update file `.env` dengan secret baru

3. Restart aplikasi:
   ```bash
   pm2 restart ai-nodejs-cicd
   ```

4. Semua token lama akan **invalid** setelah restart — user perlu login ulang

> **💡 Tip:** Untuk zero-downtime rotasi, gunakan dua JWT secret secara bergantian (current + previous). Verifikasi token dengan kedua secret — hanya gunakan secret baru untuk generate.

### Health Check

Endpoint: `GET /health`

```json
{
  "success": true,
  "message": "Server is healthy",
  "data": {
    "uptime": 12345.67,
    "memory": {
      "rss": 45000000,
      "heapTotal": 30000000,
      "heapUsed": 25000000
    },
    "node": "v20.18.0",
    "env": "production"
  }
}
```

**Docker health check** (otomatis setiap 30 detik, 3 retries):

```bash
docker inspect --format='{{json .State.Health}}' nodejs-cicd-app
```

---

## Troubleshooting

### Masalah Database

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| Database tidak terkoneksi | MariaDB tidak running | `sudo systemctl start mariadb` |
| `ER_NOT_SUPPORTED_AUTH_MODE` | MariaDB auth plugin | `ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';` |
| `Unknown database` | Database belum dibuat | `CREATE DATABASE nodejs_cicd;` |

### Masalah Redis

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| `Redis error: connect ECONNREFUSED` | Redis tidak running | `sudo systemctl start redis-server` |
| Aplikasi error di Redis | Redis tidak tersedia | App tetap jalan, caching dinonaktifkan |

### Masalah JWT

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| `Invalid or expired token` | Token expired | Login ulang |
| `jwt malformed` | Format token salah | Pastikan pakai `Bearer <token>` |
| `invalid signature` | Secret mismatch | Cek `JWT_SECRET` di `.env` |

### Masalah Deploy

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| SSH connection timeout | Firewall blokir port 22 | Buka port 22 di VPS |
| Permission denied SSH | Public key tidak terdaftar | `cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys` |
| Docker daemon error | Docker tidak running | `sudo systemctl start docker` |
| Port 3000 already in use | Aplikasi lain | Ganti PORT di `.env` atau hentikan proses lain: `pm2 stop all` |

### Health Check Logs

```bash
# Cek status aplikasi
curl http://localhost:3000/health | jq .

# Cek log error
tail -f logs/error.log

# Cek PM2 status
pm2 status
pm2 logs --lines 50
```

---

## Lisensi

Proyek ini dibuat untuk tujuan pembelajaran dan demonstrasi CI/CD. Silakan digunakan dan dimodifikasi sesuai kebutuhan.
