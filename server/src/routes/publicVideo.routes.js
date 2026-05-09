/**
 * Public Video Routes
 * Purpose: Wire public-link analysis endpoints with validators and controller methods.
 * SRS Reference: FR-01.1, FR-02.4, FR-04.1
 */
import express from 'express';

import PublicVideoController from '../controllers/publicVideo.controller.js';
import PublicVideo from '../models/publicVideo.model.js';
import PublicVideoRepository from '../repositories/publicVideo.repository.js';
import PublicTranscriptService from '../services/publicTranscript.service.js';
import PublicVideoService from '../services/publicVideo.service.js';
import TranscriptAnalysisService from '../services/transcriptAnalysis.service.js';
import { validate } from '../middlewares/validator.middleware.js';
import cache from '../utils/cache.js';
import PublicVideoValidator from '../validators/publicVideo.validator.js';

const router = express.Router();

const repository = new PublicVideoRepository(PublicVideo);
const analysisService = new TranscriptAnalysisService();
const transcriptService = new PublicTranscriptService();
const service = new PublicVideoService(repository, analysisService, transcriptService, cache);
const controller = new PublicVideoController(service);

router.get(
    '/',
    validate(PublicVideoValidator.listRules),
    controller.list
);

router.post(
    '/analyze',
    validate(PublicVideoValidator.analyzeRules),
    controller.analyzeLink
);

router.get(
    '/:id',
    validate(PublicVideoValidator.idRules),
    controller.getById
);

router.get(
    '/:id/summary',
    validate(PublicVideoValidator.idRules),
    controller.getSummary
);

router.get(
    '/:id/last-five-minutes',
    validate(PublicVideoValidator.idRules),
    controller.getLastFiveMinutes
);

router.post(
    '/:id/ask',
    validate(PublicVideoValidator.askRules),
    controller.ask
);

router.delete(
    '/:id',
    validate(PublicVideoValidator.idRules),
    controller.delete
);

export default router;
