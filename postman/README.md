# Postman Collection & Environment

Dokumen ini memandu Anda untuk mengimpor dan menggunakan koleksi dan environment Postman untuk menguji API aplikasi edukasi.

## 📦 Files

1. **Environment.postman_environment.json** - Environment variables untuk testing
2. **Collection.postman_collection.json** - Collection semua API endpoints

## 🚀 Setup di Postman

### 1. Import Environment

1. Buka aplikasi Postman Anda
2. Klik tombol **Import** di pojok kiri atas
3. Pilih opsi **Files** dan arahkan ke file `Environment.postman_environment.json`
4. Klik **Import**

### 2. Import Collection

1. Klik **Import** lagi
2. Pilih file `Collection.postman_collection.json`
3. Klik **Import**

### 3. Konfigurasi Environment

1. Setelah diimpor, Anda akan melihat environment baru bernama **"Rest API - Development"** di dropdown **Environments** (biasanya di kanan atas Postman)
2. Pilih environment tersebut
3. Edit nilai awal untuk:
   - `email`: Email asli Anda untuk testing (contoh: `your-email@gmail.com`)
   - `username`: Username untuk testing (contoh: `testuser`)
   - `password`: Password untuk testing (contoh: `TestPass123!`)
   - `full_name`, `gender`, `grade_level_id`, `class_id`, `bio`: Data profil (opsional)

**Variables yang akan diisi otomatis:**
- `token` - Akan terisi setelah login
- `user_id` - Akan terisi setelah register/login
- `otp_code` - Akan terisi setelah register (dev mode) atau request OTP

## 📋 Urutan Testing yang Disarankan

### Flow Lengkap (Register → Verify → Login → Profile)

#### 1. Health Check
- **Endpoint:** `GET {{base_url}}/`
- **Deskripsi:** Pastikan API server berjalan
- **Expected:** `{ "success": true, "message": "API is running" }`

#### 2. Register
- **Endpoint:** `POST {{auth_url}}/register`
- **Body:**
  ```json
  {
    "username": "{{username}}",
    "email": "{{email}}",
    "password": "{{password}}",
    "confirm_password": "{{password}}"
  }
  ```
- **Deskripsi:** Register user baru. OTP akan dikirim otomatis ke email.
- **Expected:** 
  - Status: `201 Created`
  - Response: User created, OTP sent
  - **Note:** Di development mode, OTP code juga muncul di response JSON
- **Auto-saved:** `user_id`, `email`, `username`, `otp_code` (dev mode)

#### 3. Verify Email
- **Endpoint:** `POST {{auth_url}}/verify-email`
- **Body:**
  ```json
  {
    "email": "{{email}}",
    "otp_code": "{{otp_code}}"
  }
  ```
- **Deskripsi:** Verify email dengan OTP code yang diterima via email
- **Expected:** 
  - Status: `200 OK`
  - Response: `{ "success": true, "message": "Email verified successfully" }`
- **Note:** 
  - Jika OTP tidak ada di response (production), cek inbox email Anda
  - OTP expired dalam 2 jam

#### 4. Request OTP (Resend) - Optional
- **Endpoint:** `POST {{auth_url}}/request-otp`
- **Body:**
  ```json
  {
    "email": "{{email}}",
    "purpose": "email_verification"
  }
  ```
- **Deskripsi:** Request OTP baru jika OTP sebelumnya expired
- **Expected:** 
  - Status: `200 OK`
  - Response: OTP sent to email
- **Auto-saved:** `otp_code` (dev mode)
- **Note:** Hanya bisa digunakan untuk email yang sudah terdaftar tapi belum verified

#### 5. Login
- **Endpoint:** `POST {{auth_url}}/login`
- **Body:**
  ```json
  {
    "email": "{{email}}",
    "password": "{{password}}"
  }
  ```
- **Deskripsi:** Login dengan email dan password. Email harus sudah terverifikasi.
- **Expected:** 
  - Status: `200 OK`
  - Response: Token dan user data
- **Auto-saved:** `token`, `user_id`

#### 6. Get Current User (Me)
- **Endpoint:** `GET {{auth_url}}/me`
- **Header:** `Authorization: Bearer {{token}}`
- **Deskripsi:** Get informasi user yang sedang login
- **Expected:** User data dengan profile

#### 7. Get Profile
- **Endpoint:** `GET {{profile_url}}/`
- **Header:** `Authorization: Bearer {{token}}`
- **Deskripsi:** Get profil user
- **Expected:** Profile data dengan `profile_complete` status

#### 8. Complete Profile (Onboarding)
- **Endpoint:** `PUT {{profile_url}}/complete`
- **Header:** 
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- **Body:**
  ```json
  {
    "full_name": "{{full_name}}",
    "gender": "{{gender}}",
    "grade_level_id": {{grade_level_id}},
    "class_id": {{class_id}},
    "bio": "{{bio}}"
  }
  ```
- **Deskripsi:** Lengkapi profil user (onboarding)
- **Expected:** Profile updated dengan `profile_complete: true`

#### 9. Update Profile
- **Endpoint:** `PUT {{profile_url}}/`
- **Header:** 
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- **Body:**
  ```json
  {
    "bio": "Updated bio"
  }
  ```
- **Deskripsi:** Update profil user (bisa update sebagian)
- **Expected:** Profile updated

## 🔑 Environment Variables

| Variabel           | Deskripsi                                                              | Diisi Otomatis? | Contoh                    |
| :----------------- | :--------------------------------------------------------------------- | :-------------- | :------------------------ |
| `base_url`         | URL dasar API                                                          | Tidak           | `http://localhost:3000`   |
| `auth_url`         | URL untuk endpoint auth                                                | Tidak           | `{{base_url}}/api/auth`   |
| `profile_url`      | URL untuk endpoint profile                                             | Tidak           | `{{base_url}}/api/profile`|
| `token`            | JWT token (setelah login)                                              | Ya              | `eyJhbGc...`              |
| `user_id`          | ID user (setelah register/login)                                       | Ya              | `123`                     |
| `otp_code`         | OTP code (dev mode atau setelah request OTP)                           | Ya              | `123456`                  |
| `email`            | Email untuk testing                                                    | Tidak           | `test@example.com`        |
| `username`         | Username untuk testing                                                 | Tidak           | `testuser`                |
| `password`         | Password untuk testing                                                 | Tidak           | `TestPass123!`            |
| `full_name`        | Nama lengkap untuk profil                                              | Tidak           | `Test User`               |
| `gender`           | Gender (male/female/other)                                             | Tidak           | `male`                    |
| `grade_level_id`   | ID jenjang kelas                                                       | Tidak           | `1`                       |
| `class_id`         | ID kelas                                                               | Tidak           | `1`                       |
| `bio`              | Bio untuk profil                                                       | Tidak           | `A test user...`          |

## 🐛 Troubleshooting

### "Route not found"
- Pastikan server berjalan (`npm start`)
- Pastikan URL request benar (gunakan `{{auth_url}}/register` bukan `/auth/register`)

### "Invalid API key"
- Periksa `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di file `.env`
- Pastikan server di-restart setelah perubahan `.env`

### "Too many requests"
- Rate limit: 5 requests per 30 detik
- Tunggu beberapa detik atau gunakan email/IP berbeda

### "Invalid email or password"
- Pastikan email sudah terverifikasi (verify email dulu)
- Periksa kredensial login

### "OTP code not found"
- Di production, cek inbox email (atau spam folder)
- Di development, OTP muncul di response JSON
- Pastikan email service sudah dikonfigurasi di `.env`

### "Email already registered"
- Email sudah terdaftar dan verified
- Gunakan email lain atau hapus user dari database

### Token expired
- Token expired setelah 7 hari
- Login lagi untuk mendapatkan token baru

## 📝 Notes

- **Development Mode:** OTP code muncul di response JSON untuk memudahkan testing
- **Production Mode:** OTP hanya dikirim via email
- **Email Service:** Pastikan email service sudah dikonfigurasi (lihat `EMAIL_SETUP.md`)
- **Rate Limiting:** 
  - Register/Login: 5 requests per 30 detik per IP
  - Request OTP: 5 requests per 30 detik per email

## 🔄 Flow Diagram

```
1. Register
   ↓
2. OTP dikirim ke email (otomatis)
   ↓
3. Verify Email (dengan OTP)
   ↓
4. Login
   ↓
5. Get Profile / Complete Profile
```

Selamat menguji API Anda dengan Postman! 🚀
