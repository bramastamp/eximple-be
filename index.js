const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:8000',
      'http://127.0.0.1:8000',
      'http://192.168.123.1:8000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',        // Vite default port
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3001',
      'http://127.0.0.1:3001'
    ];
    
    // In development, allow all origins (including devtunnels)
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      return callback(null, true);
    }
    
    // Allow devtunnels domains in development
    if (origin.includes('.devtunnels.ms') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            profile: '/api/profile',
            learning: '/api/learning',
            progress: '/api/progress',
            quiz: '/api/quiz',
            leaderboard: '/api/leaderboard',
            achievements: '/api/achievements',
            notifications: '/api/notifications',
            aiChat: '/api/ai-chat',
            admin: '/api/admin'
        }
    });
});

try {
    const authRoutes = require('./lib/Routing/AuthRoute');
    const profileRoutes = require('./lib/Routing/ProfileRoute');
    const learningRoutes = require('./lib/Routing/LearningRoute');
    const progressRoutes = require('./lib/Routing/ProgressRoute');
    const quizRoutes = require('./lib/Routing/QuizRoute');
    const leaderboardRoutes = require('./lib/Routing/LeaderboardRoute');
    const achievementRoutes = require('./lib/Routing/AchievementRoute');
    const notificationRoutes = require('./lib/Routing/NotificationRoute');
    const aiChatRoutes = require('./lib/Routing/AIChatRoute');
    const adminRoutes = require('./lib/Routing/AdminRoute');

    app.use('/api/auth', authRoutes);
    app.use('/api/profile', profileRoutes);
    app.use('/api/learning', learningRoutes);
    app.use('/api/progress', progressRoutes);
    app.use('/api/quiz', quizRoutes);
    app.use('/api/leaderboard', leaderboardRoutes);
    app.use('/api/achievements', achievementRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/ai-chat', aiChatRoutes);
    app.use('/api/admin', adminRoutes);

    const { authenticate } = require('./lib/middleware/auth');
    const LearningController = require('./lib/controllers/Learning/LearningController');
    
    app.get('/api/subjects/class/:classId', authenticate, LearningController.getSubjectsByClass);
    app.get('/api/levels/subject-level/:subjectLevelId', authenticate, LearningController.getLevelsBySubjectLevel);
    app.get('/api/levels/:levelId', authenticate, LearningController.getLevelById);
    app.get('/api/levels/:levelId/materials', authenticate, LearningController.getMaterialsByLevel);
} catch (error) {
    // Error loading routes
}

app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        method: req.method,
        path: req.originalUrl,
        availableEndpoints: {
            auth: '/api/auth/*',
            profile: '/api/profile/*',
            learning: '/api/learning/*',
            progress: '/api/progress/*',
            quiz: '/api/quiz/*',
            leaderboard: '/api/leaderboard/*',
            achievements: '/api/achievements/*',
            notifications: '/api/notifications/*',
            aiChat: '/api/ai-chat/*',
            admin: '/api/admin/*',
            subjects: '/api/subjects/class/:classId',
            levels: '/api/levels/subject-level/:subjectLevelId'
        }
    });
});

const server = app.listen(port, () => {
    // Server started
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        process.exit(1);
    } else {
        process.exit(1);
    }
});