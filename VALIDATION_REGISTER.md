# Validasi Register - Aplikasi Edukasi

## 📋 Daftar Validasi untuk Endpoint Register

### 1. **Username** (Required)
- ✅ **Required**: Harus diisi
- ✅ **Min Length**: Minimum 3 karakter
- ✅ **Max Length**: Maximum 100 karakter (sesuai schema: `VARCHAR(100)`)
- ✅ **Format**: 
  - Hanya alphanumeric, underscore (_), dan dash (-)
  - Tidak boleh dimulai dengan angka
  - Tidak boleh mengandung spasi
  - Case-insensitive untuk pengecekan uniqueness
- ✅ **Uniqueness**: Username harus unik (cek di database)
- ✅ **Blacklist**: Tidak boleh menggunakan kata-kata terlarang (admin, root, system, dll)

**Contoh Valid:**
- `john_doe`
- `student123`
- `user-name`

**Contoh Invalid:**
- `ab` (terlalu pendek)
- `user name` (ada spasi)
- `123user` (dimulai angka)
- `admin` (blacklist)

---

### 2. **Email** (Required)
- ✅ **Required**: Harus diisi
- ✅ **Format**: Valid email format (RFC 5322)
  - Harus ada @
  - Harus ada domain yang valid
  - Tidak boleh spasi
  - Case-insensitive untuk pengecekan uniqueness
- ✅ **Max Length**: Maximum 255 karakter (sesuai schema: `VARCHAR(255)`)
- ✅ **Uniqueness**: Email harus unik (cek di database)
- ✅ **Domain Validation**: 
  - Opsional: Block email temporary/disposable (contoh: 10minutemail.com)
  - Opsional: Validasi domain MX record

**Contoh Valid:**
- `user@example.com`
- `student.name@school.edu`

**Contoh Invalid:**
- `invalid-email` (tidak ada @)
- `user@` (tidak ada domain)
- `@domain.com` (tidak ada username)

---

### 3. **Password** (Required)
- ✅ **Required**: Harus diisi
- ✅ **Min Length**: Minimum 8 karakter (best practice)
- ✅ **Max Length**: Maximum 128 karakter (untuk keamanan hash)
- ✅ **Complexity Requirements**:
  - Minimal 1 huruf besar (A-Z)
  - Minimal 1 huruf kecil (a-z)
  - Minimal 1 angka (0-9)
  - Minimal 1 karakter khusus (!@#$%^&*()_+-=[]{}|;:,.<>?)
- ✅ **Common Password Check**: 
  - Tidak boleh password umum (password123, 12345678, dll)
  - Opsional: Cek terhadap database password yang pernah bocor
- ✅ **No Username/Email**: Password tidak boleh sama dengan username atau email

**Contoh Valid:**
- `MyP@ssw0rd`
- `Secure123!Pass`

**Contoh Invalid:**
- `pass` (terlalu pendek)
- `password` (tidak ada angka/karakter khusus)
- `PASSWORD123` (tidak ada huruf kecil)

---

### 4. **Confirm Password** (Required)
- ✅ **Required**: Harus diisi
- ✅ **Match**: Harus sama persis dengan password

---

### 5. **Full Name** (Optional, tapi Recommended)
- ✅ **Max Length**: Maximum 255 karakter (sesuai schema: `VARCHAR(255)`)
- ✅ **Format**: 
  - Boleh mengandung spasi, huruf, dan karakter khusus (untuk nama internasional)
  - Minimal 2 karakter jika diisi
  - Tidak boleh hanya spasi

**Contoh Valid:**
- `John Doe`
- `Muhammad Ali`
- `José María`

---

### 6. **Gender** (Optional)
- ✅ **Enum Values**: Hanya menerima nilai dari enum `gender_t`:
  - `'male'`
  - `'female'`
  - `'other'`
- ✅ **Case Sensitive**: Harus lowercase

---

### 7. **Grade Level ID** (Optional)
- ✅ **Type**: Integer
- ✅ **Exists**: Harus ada di tabel `grade_levels`
- ✅ **Active**: Grade level harus aktif (jika ada flag is_active)

---

### 8. **Class ID** (Optional)
- ✅ **Type**: Integer
- ✅ **Exists**: Harus ada di tabel `classes`
- ✅ **Consistency**: Jika `class_id` diisi, harus sesuai dengan `grade_level_id`
  - Class harus belong ke grade_level yang dipilih
- ✅ **Active**: Class harus aktif (jika ada flag is_active)

**Logic:**
```
IF class_id IS PROVIDED THEN
  - class_id harus exist di classes
  - class.grade_level_id harus sama dengan grade_level_id yang dipilih
END IF
```

---

### 9. **OTP Code** (Required untuk Email Verification)
- ✅ **Required**: Harus diisi jika menggunakan email verification
- ✅ **Format**: 6-8 digit numeric atau alphanumeric
- ✅ **Length**: Sesuai dengan format yang digunakan (default: 6 digit)
- ✅ **Validation**:
  - OTP harus exist di tabel `otp_codes`
  - OTP harus untuk `purpose = 'email_verification'`
  - OTP harus untuk email yang sama dengan email registrasi
  - OTP belum digunakan (`is_used = FALSE`)
  - OTP belum expired (`expires_at > now()`)
  - OTP belum mencapai max attempts (`attempts < max_attempts`)

---

## 🔒 Validasi Keamanan Tambahan

### 10. **Rate Limiting**
- ✅ **Per Email**: Maksimal 3 request register per 15 menit per email
- ✅ **Per IP**: Maksimal 5 request register per 15 menit per IP address
- ✅ **Per Username**: Maksimal 3 request register per 15 menit per username

### 11. **Bot Protection**
- ✅ **CAPTCHA**: Opsional, tapi direkomendasikan untuk production
- ✅ **Honeypot Field**: Field tersembunyi yang tidak boleh diisi
- ✅ **Request Timing**: Deteksi request yang terlalu cepat (bot behavior)

### 12. **Input Sanitization**
- ✅ **XSS Prevention**: Escape/sanitize semua input
- ✅ **SQL Injection**: Gunakan parameterized queries
- ✅ **Trim Whitespace**: Trim leading/trailing whitespace dari semua string input

---

## 📝 Validasi Business Logic

### 13. **Role Assignment**
- ✅ **Default**: Jika tidak diisi, default ke `'student'`
- ✅ **Allowed Values**: Hanya `'student'`, `'teacher'`, `'admin'`
- ✅ **Admin Restriction**: Role `'admin'` hanya bisa dibuat oleh admin yang sudah login (jika register public, tidak boleh set admin)

### 14. **Email Verification Flow**
- ✅ **Option 1**: Register → Kirim OTP → Verify OTP → Account aktif
- ✅ **Option 2**: Register → Account inactive → Kirim OTP → Verify OTP → Account aktif
- ✅ **Verification Required**: User tidak bisa login sebelum email terverifikasi

---

## 🎯 Urutan Validasi (Recommended)

1. **Input Sanitization** (trim, escape)
2. **Required Fields Check** (username, email, password, confirm_password)
3. **Format Validation** (email format, username format, password complexity)
4. **Length Validation** (min/max length)
5. **Uniqueness Check** (username, email - query database)
6. **Business Logic** (grade_level_id, class_id consistency)
7. **OTP Validation** (jika menggunakan email verification)
8. **Rate Limiting Check**
9. **Security Checks** (CAPTCHA, honeypot, timing)

---

## 📊 Response Error Format (Recommended)

```json
{
  "success": false,
  "errors": [
    {
      "field": "username",
      "message": "Username sudah digunakan",
      "code": "USERNAME_EXISTS"
    },
    {
      "field": "email",
      "message": "Format email tidak valid",
      "code": "INVALID_EMAIL_FORMAT"
    },
    {
      "field": "password",
      "message": "Password harus minimal 8 karakter dengan kombinasi huruf besar, kecil, angka, dan karakter khusus",
      "code": "WEAK_PASSWORD"
    }
  ]
}
```

---

## ✅ Success Response Format (Recommended)

```json
{
  "success": true,
  "message": "Registrasi berhasil. Silakan cek email untuk verifikasi.",
  "data": {
    "user_id": 123,
    "username": "john_doe",
    "email": "john@example.com",
    "email_verified": false,
    "otp_sent": true
  }
}
```

---

## 🔍 Database Constraints (Sudah ada di Schema)

- ✅ `username` UNIQUE
- ✅ `email` UNIQUE
- ✅ `username` NOT NULL
- ✅ `role` dengan enum constraint
- ✅ `gender` dengan enum constraint (jika diisi)
- ✅ Foreign key constraints untuk `grade_level_id` dan `class_id`

---

## 📌 Catatan Penting

1. **Password Hashing**: Jangan pernah simpan password dalam plain text. Gunakan bcrypt/argon2 dengan salt.
2. **Email Verification**: Disarankan menggunakan OTP untuk verifikasi email sebelum user bisa login.
3. **Error Messages**: Jangan expose informasi sensitif (contoh: jangan bilang "email sudah terdaftar", cukup "email atau password salah").
4. **Logging**: Log semua attempt register (success & failed) untuk audit dan security monitoring.
5. **Async Operations**: Kirim email OTP secara async agar tidak block response.

