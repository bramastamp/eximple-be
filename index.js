const express = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
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
            profile: '/api/profile'
        }
    });
});

try {
    const authRoutes = require('./lib/Routing/AuthRoute');
    const profileRoutes = require('./lib/Routing/ProfileRoute');

    app.use('/api/auth', authRoutes);
    app.use('/api/profile', profileRoutes);

    console.log('Routes loaded successfully');
    console.log('Available endpoints:');
    console.log('   - POST /api/auth/request-otp');
    console.log('   - POST /api/auth/register');
    console.log('   - POST /api/auth/verify-email');
    console.log('   - POST /api/auth/login');
    console.log('   - GET  /api/auth/me');
    console.log('   - GET  /api/profile');
    console.log('   - PUT  /api/profile/complete');
    console.log('   - PUT  /api/profile');
} catch (error) {
    console.error('Error loading routes:', error.message);
    console.error(error.stack);
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
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

app.use((req, res) => {
    console.log(`Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: 'Route not found',
        method: req.method,
        path: req.originalUrl,
        availableEndpoints: {
            auth: '/api/auth/*',
            profile: '/api/profile/*'
        }
    });
});//call

app.listen(port, () => {
    console.log(`Server Running, http://localhost:${port}`);
});