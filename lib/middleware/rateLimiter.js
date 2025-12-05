/**
 * Simple in-memory rate limiter
 * For production, consider using Redis
 */
const rateLimitStore = new Map();

const rateLimiter = (maxRequests = 5, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    // Clean old entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (now - v.windowStart > windowMs) {
        rateLimitStore.delete(k);
      }
    }

    const record = rateLimitStore.get(key);

    if (!record) {
      rateLimitStore.set(key, {
        count: 1,
        windowStart: now
      });
      return next();
    }

    if (now - record.windowStart > windowMs) {
      // New window
      rateLimitStore.set(key, {
        count: 1,
        windowStart: now
      });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((windowMs - (now - record.windowStart)) / 1000)
      });
    }

    record.count++;
    next();
  };
};

module.exports = rateLimiter;

