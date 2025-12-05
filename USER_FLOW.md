# User Flow - Registrasi & Profil Lengkap

## 📋 Alur Pengisian Data User

### **Fase 1: REGISTER (Minimal Data)**
**Endpoint:** `POST /api/auth/register`

**Data yang WAJIB diisi:**
- ✅ `username`
- ✅ `email`
- ✅ `password`
- ✅ `confirm_password`
- ✅ `otp_code` (untuk verifikasi email)

**Data yang TIDAK diisi:**
- ❌ `full_name`
- ❌ `gender`
- ❌ `grade_level_id`
- ❌ `class_id`
- ❌ `bio`
- ❌ `avatar_url`

**Aksi setelah register:**
1. Buat record di tabel `users`
2. Buat record kosong di tabel `user_profiles` (dengan `user_id` saja)
3. Inisialisasi `user_points` dengan 0
4. Inisialisasi `user_streaks` dengan 0
5. Kirim response: `email_verified: false`, `profile_complete: false`

---

### **Fase 2: EMAIL VERIFICATION**
**Endpoint:** `POST /api/auth/verify-email`

**Flow:**
1. User input OTP yang diterima via email
2. Verify OTP code
3. Update status email verified
4. Set `is_active = true` di tabel `users`
5. User bisa login setelah ini

---

### **Fase 3: ONBOARDING / COMPLETE PROFILE (Setelah Login Pertama)**
**Endpoint:** `PUT /api/profile/complete` atau `POST /api/profile/onboarding`

**Kapan dipanggil:**
- ✅ Setelah user **login pertama kali** (jika `profile_complete = false`)
- ✅ Bisa dipanggil kapan saja untuk melengkapi profil
- ✅ Frontend bisa cek `profile_complete` dari response login

**Data yang BISA diisi:**
- ✅ `full_name` (recommended)
- ✅ `gender` (optional)
- ✅ `grade_level_id` (recommended untuk student)
- ✅ `class_id` (recommended untuk student, harus sesuai grade_level_id)
- ✅ `bio` (optional)
- ✅ `avatar_url` (optional, upload via endpoint terpisah)

**Validasi:**
- `class_id` harus exist dan belong ke `grade_level_id` yang dipilih
- Semua field optional, tapi bisa dibuat required untuk onboarding flow

**Response setelah complete:**
```json
{
  "success": true,
  "message": "Profil berhasil dilengkapi",
  "data": {
    "profile_complete": true,
    "user": { ... }
  }
}
```

---

### **Fase 4: UPDATE PROFILE (Kapan Saja)**
**Endpoint:** `PUT /api/profile` atau `PATCH /api/profile`

**Kapan dipanggil:**
- ✅ User sudah login
- ✅ Ingin update data profil yang sudah ada
- ✅ Bisa update sebagian atau semua field

**Data yang BISA diupdate:**
- ✅ `full_name`
- ✅ `gender`
- ✅ `grade_level_id` (dengan validasi class_id harus diupdate juga jika sudah ada)
- ✅ `class_id` (dengan validasi harus sesuai grade_level_id)
- ✅ `bio`
- ✅ `avatar_url`

**Validasi:**
- User hanya bisa update profil sendiri (cek `user_id` dari JWT/token)
- `class_id` harus konsisten dengan `grade_level_id`

---

## 🔄 Flow Diagram

```
┌─────────────────┐
│   REGISTER      │
│ (username,      │
│  email, pass)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  VERIFY EMAIL   │
│   (OTP Code)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     LOGIN       │
│ (email, pass)   │
└────────┬────────┘
         │
         ▼
    ┌─────────┐
    │ Profile │
    │Complete?│
    └────┬────┘
         │
    ┌────┴────┐
    │         │
   NO        YES
    │         │
    ▼         ▼
┌─────────┐ ┌──────────────┐
│ONBOARDING│ │  DASHBOARD  │
│  FLOW   │ │   (Main App) │
└────┬────┘ └──────┬───────┘
    │              │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ UPDATE PROFILE│
    │  (Kapan Saja) │
    └──────────────┘
```

---

## 📝 Endpoint Structure (Recommended)

### **1. Register**
```
POST /api/auth/register
Body: {
  username: string,
  email: string,
  password: string,
  confirm_password: string,
  otp_code: string
}
```

### **2. Verify Email**
```
POST /api/auth/verify-email
Body: {
  email: string,
  otp_code: string
}
```

### **3. Login**
```
POST /api/auth/login
Body: {
  email: string,
  password: string
}

Response: {
  token: string,
  user: {
    id: number,
    username: string,
    email: string,
    profile_complete: boolean,  // ← Cek ini di frontend
    profile: {
      full_name: string | null,
      gender: string | null,
      grade_level_id: number | null,
      class_id: number | null
    }
  }
}
```

### **4. Complete Profile / Onboarding**
```
PUT /api/profile/complete
Headers: { Authorization: Bearer <token> }
Body: {
  full_name?: string,
  gender?: 'male' | 'female' | 'other',
  grade_level_id?: number,
  class_id?: number,
  bio?: string
}
```

### **5. Update Profile**
```
PUT /api/profile
Headers: { Authorization: Bearer <token> }
Body: {
  full_name?: string,
  gender?: 'male' | 'female' | 'other',
  grade_level_id?: number,
  class_id?: number,
  bio?: string
}
```

### **6. Get Profile**
```
GET /api/profile
Headers: { Authorization: Bearer <token> }

Response: {
  user: {
    id: number,
    username: string,
    email: string,
    profile: {
      full_name: string | null,
      gender: string | null,
      grade_level_id: number | null,
      class_id: number | null,
      grade_level: { id, name } | null,
      class: { id, name } | null,
      bio: string | null,
      avatar_url: string | null
    }
  }
}
```

### **7. Upload Avatar**
```
POST /api/profile/avatar
Headers: { Authorization: Bearer <token> }
Content-Type: multipart/form-data
Body: {
  avatar: File
}

Response: {
  avatar_url: string
}
```

---

## 🎯 Frontend Flow Logic

### **Setelah Login Success:**
```javascript
// Cek apakah profil sudah lengkap
if (!response.data.profile_complete) {
  // Redirect ke onboarding page
  router.push('/onboarding');
} else {
  // Redirect ke dashboard
  router.push('/dashboard');
}
```

### **Onboarding Page:**
- Form untuk melengkapi profil
- Validasi: grade_level_id dan class_id harus diisi untuk student
- Setelah submit → call `PUT /api/profile/complete`
- Setelah success → redirect ke dashboard

### **Profile Settings Page:**
- User bisa update profil kapan saja
- Call `PUT /api/profile` untuk update
- Bisa update sebagian field saja (PATCH behavior)

---

## 🔍 Database Logic

### **Saat Register:**
```sql
-- 1. Insert ke users
INSERT INTO users (username, email, password_hash, role)
VALUES (?, ?, ?, 'student');

-- 2. Insert ke user_profiles (kosong)
INSERT INTO user_profiles (user_id)
VALUES (LASTVAL());

-- 3. Inisialisasi user_points
INSERT INTO user_points (user_id, total_points, weekly_points, monthly_points)
VALUES (LASTVAL(), 0, 0, 0);

-- 4. Inisialisasi user_streaks
INSERT INTO user_streaks (user_id, current_streak, longest_streak)
VALUES (LASTVAL(), 0, 0);
```

### **Saat Complete Profile:**
```sql
-- Update user_profiles
UPDATE user_profiles
SET 
  full_name = ?,
  gender = ?,
  grade_level_id = ?,
  class_id = ?,
  bio = ?,
  updated_at = now()
WHERE user_id = ?;
```

### **Cek Profile Complete:**
```sql
-- Query untuk cek apakah profil sudah lengkap
SELECT 
  CASE 
    WHEN up.full_name IS NOT NULL 
      AND up.grade_level_id IS NOT NULL 
      AND up.class_id IS NOT NULL 
    THEN true 
    ELSE false 
  END as profile_complete
FROM users u
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE u.id = ?;
```

---

## ✅ Best Practices

1. **Register Minimal**: Hanya data yang benar-benar wajib (username, email, password)
2. **Onboarding Flow**: Setelah login pertama, guide user untuk complete profile
3. **Optional Fields**: Gender, bio, avatar bisa diisi kapan saja
4. **Required untuk Student**: Grade level dan class sebaiknya required untuk role student
5. **Profile Complete Flag**: Gunakan flag untuk tracking apakah user sudah complete profile
6. **Validation**: Validasi class_id harus sesuai dengan grade_level_id setiap kali update

---

## 🚨 Edge Cases

1. **User skip onboarding**: Boleh, tapi mungkin tidak bisa akses fitur tertentu yang butuh grade/class
2. **Update grade/class**: Jika user update grade_level_id, harus update class_id juga (atau set null)
3. **Teacher/Admin**: Tidak perlu grade_level_id dan class_id (bisa null)
4. **Profile Complete Logic**: Bisa custom sesuai kebutuhan (contoh: minimal full_name + grade_level + class)

---

## 📌 Summary

| Data | Kapan Diisi | Wajib/Opsional |
|------|-------------|----------------|
| `username` | Register | ✅ Wajib |
| `email` | Register | ✅ Wajib |
| `password` | Register | ✅ Wajib |
| `full_name` | Onboarding/Update Profile | ⚠️ Recommended |
| `gender` | Onboarding/Update Profile | ⭕ Opsional |
| `grade_level_id` | Onboarding/Update Profile | ⚠️ Recommended (Student) |
| `class_id` | Onboarding/Update Profile | ⚠️ Recommended (Student) |
| `bio` | Update Profile | ⭕ Opsional |
| `avatar_url` | Update Profile | ⭕ Opsional |

