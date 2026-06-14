const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs = 900000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
  });
};

const authLimiter = createRateLimiter(900000, 10);
const apiLimiter = createRateLimiter(900000, 100);

module.exports = { createRateLimiter, authLimiter, apiLimiter };
