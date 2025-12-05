// /**
//  * Simple in-memory rate limiter
//  * For production, consider using Redis
//  */
// const rateLimitStore = new Map();

// // More lenient limits for development
// const isDevelopment = process.env.NODE_ENV === 'development';

// const rateLimiter = (maxRequests = 5, windowMs = 15 * 60 * 1000) => {
//   // In development, allow more requests
//   const effectiveMaxRequests = isDevelopment ? maxRequests * 3 : maxRequests;
//   const effectiveWindowMs = isDevelopment ? windowMs / 2 : windowMs; // Shorter window in dev

//   return (req, res, next) => {
//     const key = req.ip || req.connection.remoteAddress || 'unknown';
//     const now = Date.now();

//     // Clean old entries
//     for (const [k, v] of rateLimitStore.entries()) {
//       if (now - v.windowStart > effectiveWindowMs) {
//         rateLimitStore.delete(k);
//       }
//     }

//     const record = rateLimitStore.get(key);

//     if (!record) {
//       rateLimitStore.set(key, {
//         count: 1,
//         windowStart: now
//       });
//       return next();
//     }

//     if (now - record.windowStart > effectiveWindowMs) {
//       // New window
//       rateLimitStore.set(key, {
//         count: 1,
//         windowStart: now
//       });
//       return next();
//     }

//     if (record.count >= effectiveMaxRequests) {
//       const retryAfter = Math.ceil((effectiveWindowMs - (now - record.windowStart)) / 1000);
      
//       if (isDevelopment) {
//         console.log(`⚠️ Rate limit hit for ${key}: ${record.count}/${effectiveMaxRequests} requests`);
//       }

//       return res.status(429).json({
//         success: false,
//         message: 'Too many requests. Please try again later.',
//         retryAfter: retryAfter,
//         ...(isDevelopment && {
//           debug: {
//             count: record.count,
//             maxRequests: effectiveMaxRequests,
//             windowStart: new Date(record.windowStart).toISOString(),
//             resetIn: retryAfter + ' seconds'
//           }
//         })
//       });
//     }

//     record.count++;
//     next();
//   };
// };

// // Function to clear rate limit for a specific IP (development only)
// const clearRateLimit = (ip) => {
//   if (isDevelopment) {
//     rateLimitStore.delete(ip);
//     return true;
//   }
//   return false;
// };

// // Function to clear all rate limits (development only)
// const clearAllRateLimits = () => {
//   if (isDevelopment) {
//     rateLimitStore.clear();
//     return true;
//   }
//   return false;
// };

// // Function to get rate limit status (development only)
// const getRateLimitStatus = (ip) => {
//   if (!isDevelopment) return null;
//   return rateLimitStore.get(ip) || null;
// };

// module.exports = rateLimiter;
// module.exports.clearRateLimit = clearRateLimit;
// module.exports.clearAllRateLimits = clearAllRateLimits;
// module.exports.getRateLimitStatus = getRateLimitStatus;

