# 🔐 Google Login Setup Guide

## 📋 Overview

Aplikasi sekarang mendukung **Login dengan Google** menggunakan Google OAuth 2.0. User dapat login menggunakan akun Google mereka tanpa perlu membuat password.

---

## 🚀 Setup Google OAuth

### 1. Buat Project di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang sudah ada
3. Enable **Google+ API**:
   - Go to **APIs & Services** → **Library**
   - Search "Google+ API"
   - Click **Enable**

### 2. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Jika pertama kali, setup **OAuth consent screen**:
   - Choose **External** (untuk testing) atau **Internal** (untuk G Suite)
   - Fill in required information:
     - App name: "Eximple" (atau nama aplikasi Anda)
     - User support email: Your email
     - Developer contact: Your email
   - Click **Save and Continue**
   - Add scopes (optional): `email`, `profile`
   - Add test users (untuk External apps)
   - Click **Save and Continue**

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: "Eximple Web Client" (atau nama yang diinginkan)
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     http://localhost:5173
     http://localhost:5174
     http://localhost:8080
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/auth/google/callback
     http://localhost:5173
     http://localhost:5174
     http://localhost:8080
     ```
   - Click **Create**

5. Copy **Client ID** dan **Client Secret**

### 3. Update Environment Variables

Tambahkan ke file `.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

**Untuk Production:**
```env
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
```

---

## 📱 Frontend Integration

### Menggunakan Google Sign-In Button

#### Option 1: Google Sign-In JavaScript Library

```html
<!-- Add to your HTML -->
<script src="https://accounts.google.com/gsi/client" async defer></script>

<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID"
     data-callback="handleGoogleSignIn">
</div>
<div class="g_id_signin" data-type="standard"></div>

<script>
function handleGoogleSignIn(response) {
  // Send ID token to backend
  fetch('http://localhost:3000/api/auth/google', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idToken: response.credential
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      // Save token
      localStorage.setItem('token', data.data.token);
      // Redirect or update UI
      window.location.href = '/dashboard';
    }
  });
}
</script>
```

#### Option 2: React dengan @react-oauth/google

```bash
npm install @react-oauth/google
```

```jsx
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          const response = await fetch('http://localhost:3000/api/auth/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              idToken: credentialResponse.credential
            })
          });
          
          const data = await response.json();
          if (data.success) {
            localStorage.setItem('token', data.data.token);
            // Handle success
          }
        }}
        onError={() => {
          console.log('Login Failed');
        }}
      />
    </GoogleOAuthProvider>
  );
}
```

#### Option 3: Manual OAuth Flow

```javascript
// 1. Redirect to Google OAuth
const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?
  client_id=${GOOGLE_CLIENT_ID}&
  redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&
  response_type=code&
  scope=openid email profile&
  access_type=offline`;

window.location.href = googleAuthUrl;

// 2. Handle callback (di callback page)
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

// 3. Exchange code for token (via backend)
fetch('http://localhost:3000/api/auth/google/callback', {
  method: 'POST',
  body: JSON.stringify({ code })
});
```

---

## 🔌 API Endpoints

### POST `/api/auth/google`

Login dengan Google menggunakan ID token.

**Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Google login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123",
      "username": "john_doe",
      "email": "john@gmail.com",
      "is_active": true,
      "role": "student",
      "profile_complete": false,
      "profile": null,
      "points": {
        "total": 0,
        "weekly": 0,
        "monthly": 0
      }
    }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid Google ID token"
}
```

---

## 🔄 Flow Diagram

```
1. User clicks "Login with Google"
   ↓
2. Frontend opens Google OAuth popup
   ↓
3. User selects Google account
   ↓
4. Google returns ID token
   ↓
5. Frontend sends ID token to backend
   POST /api/auth/google { idToken: "..." }
   ↓
6. Backend verifies ID token
   ↓
7. Backend gets user info from token
   ↓
8. Backend creates/updates user in database
   ↓
9. Backend returns JWT token
   ↓
10. Frontend saves token and redirects
```

---

## 🔒 Security Notes

1. **ID Token Verification**: Backend selalu verify ID token dari Google sebelum membuat/update user
2. **HTTPS Required**: Di production, pastikan menggunakan HTTPS
3. **Client ID Validation**: Backend verify bahwa token berasal dari Client ID yang benar
4. **Token Expiry**: ID token dari Google memiliki expiry time, backend handle ini otomatis

---

## 🐛 Troubleshooting

### Error: "Invalid Google ID token"

**Penyebab:**
- ID token sudah expired
- ID token tidak valid
- Client ID tidak match

**Solusi:**
- Pastikan frontend menggunakan Client ID yang benar
- Pastikan ID token masih valid (tidak expired)
- Check `GOOGLE_CLIENT_ID` di `.env` file

### Error: "Google OAuth not configured"

**Penyebab:**
- `GOOGLE_CLIENT_ID` tidak di-set di `.env`

**Solusi:**
- Tambahkan `GOOGLE_CLIENT_ID` ke file `.env`
- Restart server

### Error: "Google account does not have an email address"

**Penyebab:**
- Google account tidak memiliki email (sangat jarang)

**Solusi:**
- User harus menggunakan Google account yang memiliki email

---

## 📚 References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In JavaScript Library](https://developers.google.com/identity/gsi/web)
- [React Google OAuth](https://www.npmjs.com/package/@react-oauth/google)

---

**Last Updated**: December 2024

