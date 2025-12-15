# REST API - Education Application Backend

REST API Backend untuk aplikasi pembelajaran interaktif berbasis roadmap dengan sistem gamification.

## 📋 Table of Contents

- [Overview](#overview)
- [System Requirements](#system-requirements)
- [Dependencies](#dependencies)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Production Deployment](#production-deployment)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Aplikasi pembelajaran yang menggunakan **journey map** untuk memandu user belajar secara bertahap melalui level-level terstruktur.

### Fitur Utama:
- ✅ Struktur pembelajaran berjenjang (Subject → Level → Material → Quiz)
- ✅ Journey Map untuk visualisasi progress
- ✅ Gamification (Points, Streaks, Achievements, Leaderboard)
- ✅ Real-time progress tracking
- ✅ AI Chat Assistant (Google Gemini)
- ✅ OTP Email Verification
- ✅ File Upload (Supabase Storage)

---

## 💻 System Requirements

### Minimum Requirements:
- **Node.js**: v18.0.0 atau lebih tinggi
- **npm**: v9.0.0 atau lebih tinggi (atau yarn/pnpm)
- **PostgreSQL**: v14.0 atau lebih tinggi (atau Supabase)
- **RAM**: Minimum 512MB (recommended 1GB+)
- **Disk Space**: Minimum 500MB
## 📦 Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | ^2.86.0 | Supabase client untuk database & storage |
| `bcryptjs` | ^2.4.3 | Password hashing untuk authentication |
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing middleware |
| `dotenv` | ^16.6.1 | Environment variables management |
| `express` | ^5.1.0 | Web framework untuk REST API |
| `jsonwebtoken` | ^9.0.2 | JWT token generation & verification |
| `multer` | ^2.0.2 | File upload handling |
| `nodemailer` | ^7.0.11 | Email service untuk OTP verification |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `cross-env` | ^7.0.3 | Cross-platform environment variables |
| `nodemon` | ^3.1.11 | Auto-restart server saat development |

### Dependency Details

#### 1. **@supabase/supabase-js** (^2.86.0)
- **Purpose**: Client library untuk berinteraksi dengan Supabase (PostgreSQL database & Storage)
- **Why**: Menyediakan ORM-like interface untuk query database, real-time subscriptions, dan file storage
- **Usage**: Digunakan di `lib/config/db.js` untuk koneksi database
- **Alternatives**: `pg` (native PostgreSQL client) jika tidak menggunakan Supabase

#### 2. **bcryptjs** (^2.4.3)
- **Purpose**: Hashing password dengan algoritma bcrypt
- **Why**: Secure password storage, tidak bisa di-reverse
- **Usage**: Digunakan di authentication controller untuk hash/verify password
- **Note**: Async version (`bcrypt`) lebih cepat, tapi `bcryptjs` pure JavaScript (tidak perlu native dependencies)

#### 3. **cors** (^2.8.5)
- **Purpose**: Middleware untuk handle CORS (Cross-Origin Resource Sharing)
- **Why**: Memungkinkan frontend dari domain berbeda mengakses API
- **Usage**: Dikonfigurasi di `index.js` dengan whitelist origins untuk production

#### 4. **dotenv** (^16.6.1)
- **Purpose**: Load environment variables dari file `.env`
- **Why**: Memisahkan konfigurasi dari code (security best practice)
- **Usage**: Di-load di `index.js` dan `lib/config/db.js`

#### 5. **express** (^5.1.0)
- **Purpose**: Web framework untuk membangun REST API
- **Why**: Fast, minimal, dan flexible
- **Usage**: Main application framework, routing, middleware

#### 6. **jsonwebtoken** (^9.0.2)
- **Purpose**: Generate dan verify JWT tokens untuk authentication
- **Why**: Stateless authentication, scalable
- **Usage**: Digunakan di authentication middleware dan controllers

#### 7. **multer** (^2.0.2)
- **Purpose**: Middleware untuk handle multipart/form-data (file uploads)
- **Why**: Express tidak support file uploads secara native
- **Usage**: Digunakan di file upload endpoints

#### 8. **nodemailer** (^7.0.11)
- **Purpose**: Send emails (OTP verification, notifications)
- **Why**: Reliable, support multiple email providers
- **Usage**: Digunakan di `lib/utils/emailService.js` untuk kirim OTP

---

## 🚀 Installation

### 1. Clone Repository

```bash
git clone <[repository-url](https://github.com/bramastamp/eximple-be.git)>
cd Rest-API
```

### 2. Install Dependencies

```bash
npm install
```

Atau dengan yarn:
```bash
yarn install
```

Atau dengan pnpm:
```bash
pnpm install
```

### 3. Setup Environment Variables

Copy file `env.example` ke `.env`:

```bash
cp env.example .env
```

Edit file `.env` dan isi dengan konfigurasi yang sesuai (lihat [Configuration](#configuration)).

---

## ⚙️ Configuration

### Environment Variables

Buat file `.env` di root directory dengan konfigurasi berikut:

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3000
NODE_ENV=production

# ============================================
# JWT AUTHENTICATION
# ============================================
# Generate secret key yang kuat untuk production
# Contoh: openssl rand -base64 32
JWT_SECRET=your-secret-key-change-in-production-min-32-characters

# ============================================
# SUPABASE DATABASE
# ============================================
# Dapatkan dari: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here

# SUPABASE SERVICE ROLE KEY (Untuk Storage Upload - Bypass RLS)
# WAJIB untuk upload file ke Supabase Storage
# PENTING: Jangan expose key ini ke frontend/client!
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# ============================================
# EMAIL SERVICE (OTP Verification)
# ============================================
# Untuk OTP verification - WAJIB DIISI agar email OTP bisa terkirim
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
EMAIL_FROM_NAME=Rest API

# ============================================
# GOOGLE GEMINI AI (GRATIS)
# ============================================
# Dapatkan API Key: https://aistudio.google.com/app/apikey
# Gratis dengan batas ~60 request/hari
GEMINI_API_KEY=your-gemini-api-key-here
```

### Configuration Details

#### 1. **JWT_SECRET**
- **Required**: ✅ Yes
- **Format**: String (minimum 32 characters)
- **Generate**: `openssl rand -base64 32`
- **Security**: Jangan commit ke git, gunakan environment variable

#### 2. **SUPABASE_URL**
- **Required**: ✅ Yes
- **Format**: `https://your-project-id.supabase.co`
- **Get from**: Supabase Dashboard → Project Settings → API

#### 3. **SUPABASE_ANON_KEY**
- **Required**: ✅ Yes
- **Format**: JWT token string
- **Get from**: Supabase Dashboard → Project Settings → API
- **Security**: Safe untuk expose ke frontend (dilindungi RLS)

#### 4. **SUPABASE_SERVICE_ROLE_KEY**
- **Required**: ✅ Yes (untuk file upload)
- **Format**: JWT token string
- **Get from**: Supabase Dashboard → Project Settings → API
- **Security**: ⚠️ **NEVER expose ke frontend!** Hanya untuk backend

#### 5. **EMAIL_* Variables**
- **Required**: ✅ Yes (untuk OTP verification)
- **Options**:
  - Gmail: `smtp.gmail.com:587` (perlu App Password)
  - Outlook: `smtp-mail.outlook.com:587`
  - Custom SMTP: Sesuaikan dengan provider

#### 6. **GEMINI_API_KEY**
- **Required**: ⚠️ Optional (hanya untuk AI Chat)
- **Get from**: https://aistudio.google.com/app/apikey
- **Free Tier**: ~60 requests/day

---

## 🗄️ Database Setup

### Option 1: Supabase (Recommended)

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Wait for database to be ready

2. **Run Schema**
   - Go to Supabase Dashboard → SQL Editor
   - Copy isi file `schema/schema.sql`
   - Paste dan execute di SQL Editor
   - Verify tables created

3. **Seed Achievements**
   - Copy isi file `schema/seed_achievements.sql`
   - Paste dan execute di SQL Editor

4. **Seed Materials & Questions**
   - Copy isi file `supabase/seed.sql` (file besar, ~153K lines)
   - **Option A**: Execute via Supabase SQL Editor (paste sebagian-sebagian jika terlalu besar)
   - **Option B**: Use `psql` command-line client:
     ```bash
     psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres" -f supabase/seed.sql
     ```

### Option 2: Local PostgreSQL

1. **Install PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   
   # macOS (Homebrew)
   brew install postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create Database**
   ```bash
   createdb education_app
   ```

3. **Run Schema**
   ```bash
   psql -d education_app -f schema/schema.sql
   psql -d education_app -f schema/seed_achievements.sql
   psql -d education_app -f supabase/seed.sql
   ```

4. **Update `.env`**
   ```env
   SUPABASE_URL=http://localhost:5432
   # Note: Untuk local PostgreSQL, mungkin perlu setup Supabase local atau gunakan `pg` client langsung
   ```

### Database Schema Overview

- **Users & Profiles**: Authentication, user profiles
- **Grade Levels & Classes**: SD, SMP, SMA structure
- **Subjects & Subject Levels**: Mata pelajaran per kelas
- **Levels**: Level pembelajaran per subject
- **Materials**: Konten pembelajaran (HTML dengan video)
- **Questions & Choices**: Soal quiz
- **User Progress**: Tracking progress per level
- **User Points**: Points system (total, weekly, monthly)
- **User Streaks**: Daily streak tracking
- **Achievements**: Achievement system dengan auto-grant
- **Leaderboard**: Ranking system
- **OTP Codes**: Email verification
- **AI Chat**: Chat history dengan Gemini

---

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

Atau:
```bash
npm start
```

Server akan berjalan di `http://localhost:3000` (atau PORT yang di-set di `.env`).

### Production Mode

```bash
npm run prod
```

Atau:
```bash
NODE_ENV=production node index.js
```

### Health Check

Test API dengan:
```bash
curl http://localhost:3000/
```

Response:
```json
{
  "success": true,
  "message": "API is running",
  "version": "1.0.0"
}
```

---

## 🚢 Production Deployment

### 1. Prepare for Production

#### Update `.env`:
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=<strong-random-secret>
# ... other variables
```

#### Generate Strong JWT Secret:
```bash
openssl rand -base64 32
```

#### Update CORS Origins:
Edit `index.js` dan update `allowedOrigins` array dengan domain production Anda.

### 2. Deployment Options

#### Option A: VPS (Ubuntu/Debian)

1. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Clone & Setup**
   ```bash
   git clone <repository-url>
   cd Rest-API
   npm install --production
   cp env.example .env
   # Edit .env dengan production values
   ```

3. **Use PM2 (Process Manager)**
   ```bash
   npm install -g pm2
   pm2 start index.js --name "rest-api" --env production
   pm2 save
   pm2 startup
   ```

4. **Setup Nginx Reverse Proxy** (Optional)
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

#### Option B: Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Deploy**
   ```bash
   heroku create your-app-name
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=<your-secret>
   # ... set other env vars
   git push heroku main
   ```

#### Option C: Railway

1. **Connect Repository**
   - Go to https://railway.app
   - New Project → Deploy from GitHub
   - Select repository

2. **Set Environment Variables**
   - Railway Dashboard → Variables
   - Add all variables from `.env`

3. **Deploy**
   - Railway akan auto-deploy saat push ke main branch

#### Option D: Render

1. **Create Web Service**
   - Go to https://render.com
   - New Web Service
   - Connect GitHub repository

2. **Configure**
   - Build Command: `npm install`
   - Start Command: `npm run prod`
   - Environment Variables: Add all from `.env`

### 3. Production Checklist

- [ ] `NODE_ENV=production` di `.env`
- [ ] Strong `JWT_SECRET` (32+ characters)
- [ ] CORS origins updated dengan domain production
- [ ] Database connection string valid
- [ ] Email service configured & tested
- [ ] Supabase Storage bucket created (jika pakai file upload)
- [ ] Environment variables set di hosting platform
- [ ] PM2 atau process manager setup (untuk VPS)
- [ ] SSL/HTTPS enabled (Let's Encrypt)
- [ ] Monitoring & logging setup
- [ ] Backup strategy untuk database

---

## 📚 API Documentation

### Base URL
```
Development: http://localhost:3000/api
Production: https://api.yourdomain.com/api
```

### Main Endpoints

#### Authentication (`/api/auth`)
- `POST /register` - Register user baru
- `POST /login` - Login user
- `POST /google` - Register/Login dengan Google (OAuth 2.0) - Auto-create user jika belum ada
- `GET /me` - Get current user data
- `POST /verify-email` - Verify email dengan OTP
- `POST /resend-otp` - Resend OTP code

#### Profile (`/api/profile`)
- `GET /` - Get user profile
- `PUT /` - Update profile
- `POST /complete` - Complete profile setup

#### Subjects (`/api/subjects`)
- `GET /` - Get all subjects
- `GET /:subjectId` - Get subject by ID

#### Levels (`/api/levels`)
- `GET /subject-level/:subjectLevelId` - Get levels by subject level
- `GET /:levelId` - Get level dengan materials
- `GET /:levelId/materials` - Get materials by level

#### Progress (`/api/progress`)
- `POST /levels/:levelId/start` - Start learning level
- `GET /levels/:levelId` - Get progress
- `PUT /levels/:levelId` - Update progress
- `POST /levels/:levelId/complete` - Complete level
- `GET /my-progress` - Get all user progress
- `GET /journey-map/:subjectLevelId` - Get journey map
- `GET /stats` - Get progress statistics

#### Quiz (`/api/quiz`)
- `GET /levels/:levelId/questions` - Get questions
- `POST /levels/:levelId/submit` - Submit quiz answers

#### Leaderboard (`/api/leaderboard`)
- `GET /` - Get leaderboard (query: `type`, `limit`)
- `GET /my-rank` - Get user rank (query: `type`)

#### Achievements (`/api/achievements`)
- `GET /` - Get all achievements
- `GET /my-achievements` - Get user achievements

#### AI Chat (`/api/chat`)
- `POST /` - Send message ke AI assistant

#### File Upload (`/api/upload`)
- `POST /avatar` - Upload avatar image
- `POST /material` - Upload material file

**Full API Documentation**: Lihat `API_ACHIEVEMENTS.md` untuk contoh response JSON.

---

## 📁 Project Structure

```
Rest-API/
├── lib/
│   ├── config/
│   │   └── db.js              # Supabase client configuration
│   ├── controllers/           # Route controllers
│   │   ├── Auth/
│   │   ├── Profile/
│   │   ├── Achievement/
│   │   ├── Progress/
│   │   ├── Quiz/
│   │   ├── Leaderboard/
│   │   └── Chat/
│   ├── models/                 # Database models
│   ├── middleware/             # Express middleware
│   │   ├── auth.js             # JWT authentication
│   │   └── upload.js           # File upload handling
│   ├── Routing/                # Route definitions
│   ├── services/               # Business logic services
│   │   ├── geminiService.js    # Google Gemini AI
│   │   └── storageService.js   # Supabase Storage
│   └── utils/
│       └── emailService.js     # Email/OTP service
├── schema/
│   ├── schema.sql              # Database schema (FINAL)
│   └── seed_achievements.sql   # Achievement seed data
├── supabase/
│   └── seed.sql                # Materials & questions seed (large file)
├── index.js                    # Main application entry
├── package.json                # Dependencies & scripts
├── env.example                 # Environment variables template
├── README.md                   # This file
└── API_ACHIEVEMENTS.md         # API documentation example
```

---

## 🔒 Security

### Best Practices

1. **Environment Variables**
   - ✅ Jangan commit `.env` ke git
   - ✅ Gunakan strong secrets untuk `JWT_SECRET`
   - ✅ Jangan expose `SUPABASE_SERVICE_ROLE_KEY` ke frontend

2. **Authentication**
   - ✅ Password di-hash dengan bcrypt
   - ✅ JWT tokens expire (configure di auth middleware)
   - ✅ OTP codes expire setelah beberapa menit

3. **CORS**
   - ✅ Whitelist specific origins di production
   - ✅ Jangan allow all origins di production

4. **Database**
   - ✅ Gunakan Row Level Security (RLS) di Supabase
   - ✅ Service role key hanya untuk backend operations
   - ✅ Anon key untuk frontend (dilindungi RLS)

5. **File Upload**
   - ✅ Validate file types & sizes
   - ✅ Sanitize file names
   - ✅ Store di secure storage (Supabase Storage)

6. **API Security**
   - ✅ Rate limiting (implement jika perlu)
   - ✅ Input validation & sanitization
   - ✅ Error messages tidak expose sensitive info

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **Database Connection Error**
```
Error: Failed to connect to Supabase
```
**Solution**:
- Check `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di `.env`
- Verify Supabase project masih active
- Check network/firewall settings

#### 2. **JWT Secret Error**
```
Error: jwt malformed
```
**Solution**:
- Verify `JWT_SECRET` di `.env` sudah di-set
- Pastikan secret tidak ada whitespace
- Generate new secret: `openssl rand -base64 32`

#### 3. **Email Not Sending**
```
Error: Invalid login
```
**Solution**:
- Untuk Gmail: Gunakan App Password (bukan password biasa)
- Enable 2-Step Verification di Google Account
- Check `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`

#### 4. **File Upload Fails**
```
Error: Storage bucket not found
```
**Solution**:
- Create bucket di Supabase Dashboard → Storage
- Set bucket to public (jika perlu)
- Verify `SUPABASE_SERVICE_ROLE_KEY` valid

#### 5. **Port Already in Use**
```
Error: listen EADDRINUSE :::3000
```
**Solution**:
- Change `PORT` di `.env`
- Kill process yang menggunakan port: `lsof -ti:3000 | xargs kill`

#### 6. **Module Not Found**
```
Error: Cannot find module 'xxx'
```
**Solution**:
- Run `npm install`
- Check `package.json` dependencies
- Delete `node_modules` dan `package-lock.json`, lalu `npm install` lagi

---

## 📝 License

[Your License Here]

---

## 👥 Contributors

[Your Name/Team]

---

## 📞 Support

Untuk pertanyaan atau issues:
- Create issue di GitHub repository
- Email: [your-email@example.com]

---

**Last Updated**: December 2024

