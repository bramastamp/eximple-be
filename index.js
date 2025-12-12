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
      'http://127.0.0.1:3000'
    ];
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
    console.error('Error loading routes:', error);
}

if (process.env.NODE_ENV === 'development') {
    app.get('/api/debug/routes', (req, res) => {
        const routes = [];
        app._router.stack.forEach((middleware) => {
            if (middleware.route) {
                routes.push({
                    method: Object.keys(middleware.route.methods)[0].toUpperCase(),
                    path: middleware.route.path
                });
            } else if (middleware.name === 'router') {
                middleware.handle.stack.forEach((handler) => {
                    if (handler.route) {
                        routes.push({
                            method: Object.keys(handler.route.methods)[0].toUpperCase(),
                            path: handler.route.path
                        });
                    }
                });
            }
        });
        res.json({
            success: true,
            routes: routes
        });
    });
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
    if (process.env.NODE_ENV !== 'production') {
        console.log(`Server is running on port ${port}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`API available at: http://localhost:${port}`);
    }
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Error: Port ${port} is already in use`);
        if (process.env.NODE_ENV !== 'production') {
            console.error(`Solution: Stop the process using port ${port} or use a different PORT in .env`);
        }
        process.exit(1);
    } else {
        console.error('Error starting server:', err.message);
        process.exit(1);
    }
});