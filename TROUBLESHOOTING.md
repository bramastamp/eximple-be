# Troubleshooting Guide

## ❌ Error: "Route not found"

### Kemungkinan Penyebab:

1. **Server belum di-restart setelah perubahan**
   - **Solusi**: Restart server dengan `node index.js` atau `npm start`

2. **URL yang digunakan salah**
   - **Pastikan**: URL menggunakan format yang benar
   - ✅ Benar: `http://localhost:3000/api/auth/register`
   - ❌ Salah: `http://localhost:3000/auth/register` (kurang `/api`)
   - ❌ Salah: `http://localhost:3000/api/register` (kurang `/auth`)

3. **Method HTTP salah**
   - **Pastikan**: Menggunakan method yang benar
   - ✅ `POST /api/auth/register`
   - ❌ `GET /api/auth/register`

4. **Module tidak ter-load dengan benar**
   - **Cek**: Console log saat server start
   - Harus muncul: `✅ Routes loaded successfully`
   - Jika muncul error, cek file yang disebutkan

### Cara Debug:

1. **Cek apakah server berjalan**
   ```bash
   # Pastikan server running
   node index.js
   ```
   Harus muncul:
   ```
   ✅ Routes loaded successfully
   📋 Available endpoints:
      - POST /api/auth/request-otp
      ...
   Server Running, http://localhost:3000
   ```

2. **Test endpoint health check**
   ```bash
   # Test di browser atau Postman
   GET http://localhost:3000/
   ```
   Harus return:
   ```json
   {
     "success": true,
     "message": "API is running",
     "version": "1.0.0"
   }
   ```

3. **Cek debug route (development mode)**
   ```bash
   GET http://localhost:3000/api/debug/routes
   ```
   Akan menampilkan semua route yang terdaftar

4. **Cek console log**
   - Saat request 404, akan muncul log:
   ```
   ❌ Route not found: POST /api/auth/register
   ```

### Daftar Endpoint yang Benar:

#### Auth Endpoints:
- `POST /api/auth/request-otp`
- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/login`
- `GET /api/auth/me` (requires token)

#### Profile Endpoints:
- `GET /api/profile` (requires token)
- `PUT /api/profile/complete` (requires token)
- `PUT /api/profile` (requires token)

### Contoh Request yang Benar:

#### Request OTP:
```http
POST http://localhost:3000/api/auth/request-otp
Content-Type: application/json

{
  "email": "test@example.com",
  "purpose": "email_verification"
}
```

#### Register:
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "TestPass123!",
  "confirm_password": "TestPass123!",
  "otp_code": "123456"
}
```

#### Login:
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "TestPass123!"
}
```

### Checklist:

- [ ] Server sudah di-restart
- [ ] URL menggunakan format `/api/auth/...` atau `/api/profile/...`
- [ ] Method HTTP sudah benar (POST/GET/PUT)
- [ ] Content-Type header: `application/json`
- [ ] Body request sudah dalam format JSON
- [ ] Untuk protected routes, sudah include `Authorization: Bearer <token>`
- [ ] Port server sesuai (default: 3000)
- [ ] Tidak ada error di console saat server start

### Common Mistakes:

1. **Lupa `/api` prefix**
   - ❌ `POST /auth/register`
   - ✅ `POST /api/auth/register`

2. **Typo di URL**
   - ❌ `/api/auth/regist` (kurang 'er')
   - ✅ `/api/auth/register`

3. **Method salah**
   - ❌ `GET /api/auth/register` (harusnya POST)
   - ✅ `POST /api/auth/register`

4. **Content-Type tidak di-set**
   - Pastikan header: `Content-Type: application/json`

5. **Body bukan JSON**
   - Pastikan body dalam format JSON valid

### Jika Masih Error:

1. **Cek file structure:**
   ```
   lib/
   ├── controllers/
   │   ├── AuthController.js
   │   └── ProfileController.js
   ├── Routing/
   │   ├── AuthRoute.js
   │   └── ProfileRoute.js
   └── ...
   ```

2. **Cek apakah semua file ada:**
   ```bash
   # Windows PowerShell
   Test-Path lib\controllers\AuthController.js
   Test-Path lib\Routing\AuthRoute.js
   ```

3. **Cek console error:**
   - Baca error message di console saat server start
   - Jika ada error require module, cek path file

4. **Test dengan curl:**
   ```bash
   curl -X GET http://localhost:3000/
   curl -X POST http://localhost:3000/api/auth/request-otp -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\"}"
   ```

