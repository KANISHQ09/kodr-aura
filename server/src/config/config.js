import dotenv from 'dotenv';

dotenv.config();

const _config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 3000,
    WEB_URL: process.env.WEB_URL || 'https://yourdomain.com',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    DB_URL: process.env.DB_URL || 'mongodb://localhost:27017/mydatabase',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    AI_PROVIDER: process.env.AI_PROVIDER || 'local',
    MAX_UPLOADED_VIDEOS: Number(process.env.MAX_UPLOADED_VIDEOS || 10),
    MAX_VIDEO_UPLOAD_MB: Number(process.env.MAX_VIDEO_UPLOAD_MB || 500),
    CACHE_PROVIDER: process.env.CACHE_PROVIDER || 'memory',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    REDIS_KEY_PREFIX: process.env.REDIS_KEY_PREFIX || 'vidask',
    VIDEO_RUNTIME_CACHE_TTL_SECONDS: Number(process.env.VIDEO_RUNTIME_CACHE_TTL_SECONDS || 1800),
    QUEUE_PROVIDER: process.env.QUEUE_PROVIDER || 'none',
    BULLMQ_REDIS_URL: process.env.BULLMQ_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379',
    VIDEO_PROCESSING_QUEUE_NAME: process.env.VIDEO_PROCESSING_QUEUE_NAME || 'video-processing',
    VIDEO_PROCESSING_JOB_ATTEMPTS: Number(process.env.VIDEO_PROCESSING_JOB_ATTEMPTS || 3),
    VIDEO_PROCESSING_JOB_BACKOFF_MS: Number(process.env.VIDEO_PROCESSING_JOB_BACKOFF_MS || 5000),
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'local',
    GCS_BUCKET_NAME: process.env.GCS_BUCKET_NAME,
    GCS_PROJECT_ID: process.env.GCS_PROJECT_ID,
    GCS_KEY_FILE: process.env.GCS_KEY_FILE,
    GCS_CLIENT_EMAIL: process.env.GCS_CLIENT_EMAIL,
    GCS_PRIVATE_KEY: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    GCS_UPLOAD_PREFIX: process.env.GCS_UPLOAD_PREFIX || 'vidask/videos',
    GCS_PUBLIC_BASE_URL: process.env.GCS_PUBLIC_BASE_URL,
    GCS_SIGNED_URL_TTL_SECONDS: Number(process.env.GCS_SIGNED_URL_TTL_SECONDS || 900),
};


export default _config;
