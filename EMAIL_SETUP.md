# Email Configuration Setup

Dokumen ini menjelaskan cara mengkonfigurasi email service untuk mengirim OTP code.

## Konfigurasi di .env

Tambahkan konfigurasi berikut ke file `.env` Anda:

### Opsi 1: Gmail (Recommended untuk Development)

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

**Cara mendapatkan App Password untuk Gmail:**
1. Buka [Google Account Settings](https://myaccount.google.com/)
2. Pilih **Security** → **2-Step Verification** (aktifkan jika belum)
3. Pilih **App passwords**
4. Pilih **Mail** dan **Other (Custom name)**
5. Masukkan nama aplikasi (contoh: "Rest API")
6. Copy password yang dihasilkan
7. Gunakan password tersebut sebagai `EMAIL_PASSWORD`

### Opsi 2: SMTP Server (Production)

```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
EMAIL_FROM=your-email@example.com
```

**Contoh untuk beberapa provider:**

#### Mailtrap (Testing)
```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
EMAIL_FROM=noreply@yourapp.com
```

#### SendGrid
```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=your-verified-email@example.com
```

#### Mailgun
```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
EMAIL_FROM=noreply@your-domain.com
```

## Testing Email

Setelah konfigurasi, test dengan:

1. **Register** - OTP akan dikirim otomatis setelah register
2. **Request OTP** - Untuk resend OTP jika expired

## Troubleshooting

### Error: "Email service not configured"
- Pastikan `EMAIL_SERVICE` sudah di-set di `.env`
- Pastikan semua variabel yang diperlukan sudah diisi

### Error: "Invalid login"
- Untuk Gmail: Pastikan menggunakan App Password, bukan password biasa
- Untuk SMTP: Pastikan username dan password benar

### Email tidak terkirim
- Cek spam folder
- Pastikan port dan host benar
- Untuk Gmail, pastikan "Less secure app access" diaktifkan (jika tidak pakai App Password)

## Development Mode

Di development mode (`NODE_ENV=development`), OTP code juga akan muncul di response JSON untuk memudahkan testing tanpa perlu cek email.

