# Analisis Schema untuk Fitur UI

## ✅ Yang Sudah Cukup

### 1. Learn Section - Course & Lesson
- ✅ **Subjects** (`subjects`) - untuk "Senior High School Math"
- ✅ **Subject Levels** (`subject_levels`) - mapel per kelas
- ✅ **Levels** (`levels`) - untuk "Lesson 4 – Linear Algebra" (menggunakan `level_index`)
- ✅ **Materials** (`materials`) - konten pembelajaran
- ✅ **Questions** (`questions`) - latihan soal

### 2. Progress & Journey
- ✅ **User Progress** (`user_progress`) - status "Ongoing", progress tracking
- ✅ **Journey Map** - bisa dihitung dari `user_progress` dengan query:
  ```sql
  -- Completed: status = 'completed' (green)
  -- Current: status = 'in_progress' (yellow) 
  -- Upcoming: belum ada di user_progress (gray)
  ```

### 3. Leaderboard
- ✅ **User Points** (`user_points`) - total, weekly, monthly points
- ✅ **Leaderboard View** (`mv_leaderboard`) - ranking users
- ✅ **User Profiles** - untuk display username, avatar

### 4. Points & Rewards
- ✅ **Points Reward** (`levels.points_reward`) - reward per level
- ✅ **Points Earned** (`user_progress.points_earned`) - points yang sudah didapat

## ⚠️ Yang Perlu Ditambahkan/Diperbaiki

### 1. Reward Range (150-300)
**Masalah:** Di UI ada "Reward: 150 - 300" tapi schema hanya punya `points_reward INT`

**Solusi:** Tambahkan kolom untuk reward range:
```sql
ALTER TABLE levels 
ADD COLUMN points_reward_min INT DEFAULT 0,
ADD COLUMN points_reward_max INT DEFAULT 0;

-- Atau gunakan JSONB untuk fleksibilitas
ALTER TABLE levels 
ADD COLUMN reward_config JSONB DEFAULT '{"min": 0, "max": 0}'::jsonb;
```

### 2. Journey Map Structure
**Masalah:** Journey map perlu struktur yang lebih eksplisit untuk visualisasi

**Solusi:** Bisa dihitung dari query, atau tambahkan view:
```sql
CREATE OR REPLACE VIEW vw_user_journey AS
SELECT 
  l.id as level_id,
  l.level_index,
  l.title,
  l.subject_level_id,
  up.user_id,
  up.status,
  CASE 
    WHEN up.status = 'completed' THEN 'completed'
    WHEN up.status = 'in_progress' THEN 'current'
    ELSE 'upcoming'
  END as journey_status
FROM levels l
LEFT JOIN user_progress up ON up.level_id = l.id AND up.user_id = $1
WHERE l.subject_level_id = $2
ORDER BY l.level_index;
```

### 3. Leaderboard Period Filtering
**Masalah:** Leaderboard perlu filter per period (all-time, weekly, monthly)

**Solusi:** Buat view terpisah atau gunakan query dengan filter:
```sql
-- Weekly Leaderboard
CREATE MATERIALIZED VIEW mv_leaderboard_weekly AS
SELECT u.id, u.username, up.weekly_points as points
FROM users u
JOIN user_points up ON up.user_id = u.id
ORDER BY up.weekly_points DESC;

-- Monthly Leaderboard  
CREATE MATERIALIZED VIEW mv_leaderboard_monthly AS
SELECT u.id, u.username, up.monthly_points as points
FROM users u
JOIN user_points up ON up.user_id = u.id
ORDER BY up.monthly_points DESC;
```

### 4. User Avatar di Leaderboard
**Masalah:** Leaderboard perlu avatar_url dari user_profiles

**Solusi:** Update leaderboard view:
```sql
DROP MATERIALIZED VIEW IF EXISTS mv_leaderboard;
CREATE MATERIALIZED VIEW mv_leaderboard AS
SELECT 
  u.id as user_id, 
  u.username, 
  up.avatar_url,
  up.total_points, 
  up.weekly_points, 
  up.monthly_points
FROM users u
JOIN user_points up ON up.user_id = u.id
LEFT JOIN user_profiles up ON up.user_id = u.id
ORDER BY up.total_points DESC;
```

## 📝 Rekomendasi Tambahan

### 1. Index untuk Performance
```sql
-- Untuk query journey map
CREATE INDEX idx_user_progress_user_status ON user_progress(user_id, status);

-- Untuk leaderboard filtering
CREATE INDEX idx_user_points_weekly ON user_points(weekly_points DESC);
CREATE INDEX idx_user_points_monthly ON user_points(monthly_points DESC);
```

### 2. Function untuk Refresh Leaderboard
```sql
CREATE OR REPLACE FUNCTION refresh_leaderboards()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_leaderboard;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_leaderboard_weekly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_leaderboard_monthly;
END;
$$ LANGUAGE plpgsql;
```

### 3. Trigger untuk Auto-update Weekly/Monthly Points
```sql
-- Reset weekly points setiap Senin
-- Reset monthly points setiap tanggal 1
-- Bisa di-handle di aplikasi layer dengan cron job
```

## ✅ Kesimpulan

**Schema sudah 85% cukup** untuk fitur UI. Yang perlu ditambahkan:

1. ✅ **Reward range** (min/max points) - **PENTING**
2. ✅ **Leaderboard views** untuk weekly/monthly - **PENTING**
3. ✅ **Journey view** untuk visualisasi - **OPSIONAL** (bisa dihitung)
4. ✅ **Avatar di leaderboard** - **OPSIONAL** (bisa di-join)

Schema inti sudah solid, hanya perlu beberapa enhancement untuk fitur spesifik di UI.


