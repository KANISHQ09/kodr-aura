import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { generalRateLimiter } from './middlewares/rateLimiter.middleware.js'
import morganLogger from './loggers/morgan.logger.js'
import config from './config/config.js'
import errorHandler from './middlewares/error.handler.js'
import publicVideoRoutes from './routes/publicVideo.routes.js';
import videoAssistantRoutes from './routes/videoAssistant.routes.js';
import videoRoutes from './routes/video.routes.js';

const app = express();

app.use(
    cors(
        {
            origin: config.FRONTEND_URL,
            credentials: true,
        }
    ));
app.use(morganLogger);
app.use(helmet());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.use(generalRateLimiter)

app.use('/api', videoAssistantRoutes);
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1/public-videos', publicVideoRoutes);



// // Simple route for checking server status
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'VidAsk AI backend is running',
        environment: config.NODE_ENV,
        documentation: '/api/v1/videos and /api/v1/public-videos',
    });
});

// // 404 route handler for undefined routes
app.all('*name', (req, res, next) => {
    const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    err.statusCode = 404;
    err.status = 'fail';
    next(err);
});

app.use(errorHandler)



export default app;
