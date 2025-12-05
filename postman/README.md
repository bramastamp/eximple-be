# Postman Collection & Environment

## 📦 Files

1. **Environment.postman_environment.json** - Environment variables untuk testing
2. **Collection.postman_collection.json** - Collection semua API endpoints

## 🚀 Setup di Postman

### 1. Import Environment

1. Buka Postman
2. Klik **Import** (kiri atas)
3. Pilih file `Environment.postman_environment.json`
4. Klik **Import**
5. Pilih environment **"Rest API - Development"** di dropdown kanan atas

### 2. Import Collection

1. Klik **Import** lagi
2. Pilih file `Collection.postman_collection.json`
3. Klik **Import**

### 3. Setup Environment Variables

Setelah import, pastikan environment variables sudah terisi:

- `base_url`: `http://localhost:3000`
- `email`: Email untuk testing (contoh: `test@example.com`)
- `password`: Password untuk testing (contoh: `TestPass123!`)
- `username`: Username untuk testing (contoh: `testuser`)

**Variables yang akan diisi otomatis:**
- `token` - Akan terisi setelah login
- `user_id` - Akan terisi setelah register/login
- `otp_code` - Akan terisi setelah request OTP

## 📋 Urutan Testing

### Flow Lengkap (Register → Login → Profile)

1. **Request OTP**
   - Endpoint: `POST /api/auth/request-otp`
   - OTP code akan otomatis tersimpan di environment variable `otp_code`
   - **Note**: Di development mode, OTP akan muncul di response

2. **Register**
   - Endpoint: `POST /api/auth/register`
   - User ID akan otomatis tersimpan di environment variable `user_id`
   - Pastikan `otp_code` sudah terisi dari step 1

3. **Verify Email** (Optional jika sudah verify di register)
   - Endpoint: `POST /api/auth/verify-email`
   - Verifikasi email dengan OTP

4. **Login**
   - Endpoint: `POST /api/auth/login`
   - Token akan otomatis tersimpan di environment variable `token`
   - User ID juga akan tersimpan

5. **Get Current User**
   - Endpoint: `GET /api/auth/me`
   - Menggunakan token dari step 4

6. **Get Profile**
   - Endpoint: `GET /api/profile`
   - Menggunakan token

7. **Complete Profile**
   - Endpoint: `PUT /api/profile/complete`
   - Lengkapi profil user

8. **Update Profile**
   - Endpoint: `PUT /api/profile`
   - Update profil yang sudah ada

## 🔧 Customize Variables

Anda bisa mengubah nilai di environment:

1. Klik icon **Environment** (kanan atas)
2. Pilih **"Rest API - Development"**
3. Edit values sesuai kebutuhan:
   - `email`: Ganti dengan email yang ingin digunakan
   - `username`: Ganti dengan username yang ingin digunakan
   - `password`: Ganti dengan password yang ingin digunakan
   - `grade_level_id`: ID grade level yang tersedia
   - `class_id`: ID class yang tersedia

## 📝 Tips Testing

### Test dengan User Baru

1. Ubah `email` dan `username` di environment
2. Jalankan flow dari awal (Request OTP → Register → Login)

### Test dengan User Existing

1. Pastikan `email` dan `password` sudah benar
2. Langsung jalankan **Login**
3. Token akan otomatis terisi
4. Lanjutkan ke endpoint yang memerlukan authentication

### Reset Token

Jika token expired atau invalid:
1. Login ulang untuk mendapatkan token baru
2. Token akan otomatis terupdate di environment

## 🐛 Troubleshooting

### Token tidak terisi otomatis
- Pastikan script di tab **Tests** berjalan dengan benar
- Cek response dari login endpoint
- Pastikan environment yang dipilih adalah **"Rest API - Development"**

### OTP Code tidak terisi
- Di development mode, OTP akan muncul di response
- Copy manual ke environment variable `otp_code`
- Atau gunakan script yang sudah ada di collection

### 401 Unauthorized
- Pastikan token sudah terisi
- Cek apakah token masih valid (tidak expired)
- Login ulang untuk mendapatkan token baru

## 📌 Environment Variables

| Variable | Description | Auto-filled |
|----------|-------------|-------------|
| `base_url` | Base URL server | ❌ Manual |
| `api_url` | API base URL | ✅ Auto |
| `auth_url` | Auth endpoints URL | ✅ Auto |
| `profile_url` | Profile endpoints URL | ✅ Auto |
| `token` | JWT token | ✅ Auto (after login) |
| `user_id` | User ID | ✅ Auto (after register/login) |
| `username` | Username untuk testing | ❌ Manual |
| `email` | Email untuk testing | ❌ Manual |
| `password` | Password untuk testing | ❌ Manual |
| `otp_code` | OTP code | ✅ Auto (after request OTP) |
| `full_name` | Full name untuk profile | ❌ Manual |
| `gender` | Gender (male/female/other) | ❌ Manual |
| `grade_level_id` | Grade level ID | ❌ Manual |
| `class_id` | Class ID | ❌ Manual |

## 🎯 Quick Start

1. Import environment dan collection
2. Pastikan server berjalan di `http://localhost:3000`
3. Pilih environment **"Rest API - Development"**
4. Jalankan request **"1. Request OTP"** di folder Auth
5. Lanjutkan ke request berikutnya sesuai urutan

Happy Testing! 🚀

