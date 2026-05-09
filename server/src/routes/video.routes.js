/**
 * Video Routes
 * Purpose: Wire uploaded video endpoints with validators and controller methods.
 * SRS Reference: FR-01.6, FR-02.4, FR-04.1
 */
import express from 'express';

import config from '../config/config.js';
import VideoController from '../controllers/video.controller.js';
import Video from '../models/video.model.js';
import VideoRepository from '../repositories/video.repository.js';
import TranscriptAnalysisService from '../services/transcriptAnalysis.service.js';
import VideoService from '../services/video.service.js';
import { validate } from '../middlewares/validator.middleware.js';
import cache from '../utils/cache.js';
import VideoValidator from '../validators/video.validator.js';

const router = express.Router();

const repository = new VideoRepository(Video);
const analysisService = new TranscriptAnalysisService();
const service = new VideoService(repository, analysisService, cache);
const controller = new VideoController(service);

router.get(
    '/',
    validate(VideoValidator.listRules),
    controller.list
);

router.post(
    '/',
    validate(VideoValidator.createRules),
    controller.createFromTranscript
);

router.post(
    '/upload',
    express.raw({
        type: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'application/octet-stream'],
        limit: `${config.MAX_VIDEO_UPLOAD_MB}mb`,
    }),
    validate(VideoValidator.uploadRules),
    controller.upload
);

router.get(
    '/:id',
    validate(VideoValidator.idRules),
    controller.getById
);

router.get(
    '/:id/summary',
    validate(VideoValidator.idRules),
    controller.getSummary
);

router.get(
    '/:id/playback-url',
    validate(VideoValidator.idRules),
    controller.getPlaybackUrl
);

router.post(
    '/:id/transcript',
    validate(VideoValidator.transcriptRules),
    controller.attachTranscript
);

router.get(
    '/:id/last-five-minutes',
    validate(VideoValidator.idRules),
    controller.getLastFiveMinutes
);

router.post(
    '/:id/ask',
    validate(VideoValidator.askRules),
    controller.ask
);

router.delete(
    '/:id',
    validate(VideoValidator.idRules),
    controller.delete
);

export default router;
