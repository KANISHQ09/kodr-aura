/**
 * Video Assistant Routes
 * Purpose: Expose the embeddable video assistant endpoints for transcript,
 * summary, Q&A, playback, and session workflows.
 */
import express from 'express';

import VideoAssistantController from '../controllers/videoAssistant.controller.js';
import PublicVideo from '../models/publicVideo.model.js';
import Video from '../models/video.model.js';
import PublicVideoRepository from '../repositories/publicVideo.repository.js';
import VideoRepository from '../repositories/video.repository.js';
import PublicTranscriptService from '../services/publicTranscript.service.js';
import PublicVideoService from '../services/publicVideo.service.js';
import TranscriptAnalysisService from '../services/transcriptAnalysis.service.js';
import VideoAssistantService from '../services/videoAssistant.service.js';
import VideoService from '../services/video.service.js';
import { validate } from '../middlewares/validator.middleware.js';
import cache from '../utils/cache.js';
import VideoAssistantValidator from '../validators/videoAssistant.validator.js';

const router = express.Router();

const analysisService = new TranscriptAnalysisService();
const videoRepository = new VideoRepository(Video);
const publicVideoRepository = new PublicVideoRepository(PublicVideo);
const videoService = new VideoService(videoRepository, analysisService, cache);
const publicTranscriptService = new PublicTranscriptService();
const publicVideoService = new PublicVideoService(
    publicVideoRepository,
    analysisService,
    publicTranscriptService,
    cache
);
const service = new VideoAssistantService(videoService, publicVideoService);
const controller = new VideoAssistantController(service);

router.post(
    '/transcribe',
    validate(VideoAssistantValidator.transcribeRules),
    controller.transcribe
);

router.post(
    '/chunk-index',
    validate(VideoAssistantValidator.chunkIndexRules),
    controller.chunkIndex
);

router.post(
    '/ask',
    validate(VideoAssistantValidator.askRules),
    controller.ask
);

router.post(
    '/ask/stream',
    validate(VideoAssistantValidator.askRules),
    controller.askStream
);

router.get(
    '/summary',
    validate(VideoAssistantValidator.summaryRules),
    controller.summary
);

router.get(
    '/playback-url',
    validate(VideoAssistantValidator.playbackUrlRules),
    controller.playbackUrl
);

router.delete(
    '/session',
    validate(VideoAssistantValidator.sessionRules),
    controller.deleteSession
);

export default router;
