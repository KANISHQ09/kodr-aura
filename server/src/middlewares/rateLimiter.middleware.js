// middleware/rateLimiter.js
import rateLimit from "express-rate-limit";

export const generalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per IP
    standardHeaders: true,
    legacyHeaders: false,

    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many requests. Please try again later.",
        });
    },
});
