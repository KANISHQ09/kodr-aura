/**
 * Public Video Validator
 * Purpose: Validate public-link analysis, query params, and Q&A requests.
 * SRS Reference: FR-01.1, FR-02.4, FR-04.1
 */
import { body, param, query } from 'express-validator';

class PublicVideoValidator {
    static idRules = [
        param('id').isMongoId().withMessage('Valid public video analysis id is required'),
    ];

    static analyzeRules = [
        body('sourceUrl')
            .notEmpty()
            .withMessage('sourceUrl is required')
            .isURL({ require_protocol: true })
            .withMessage('sourceUrl must be a public URL with protocol')
            .isLength({ max: 2000 })
            .withMessage('sourceUrl is too long')
            .trim(),
        body('title')
            .optional()
            .isLength({ min: 1, max: 200 })
            .withMessage('Title must be between 1 and 200 characters')
            .trim(),
        body('forceRefresh').optional().isBoolean().toBoolean(),
        body('transcriptText')
            .optional()
            .isLength({ min: 1, max: 500000 })
            .withMessage('Transcript text is too large')
            .trim(),
        body('transcriptSegments')
            .optional()
            .isArray({ max: 10000 })
            .withMessage('Transcript segments must be an array'),
        body('transcriptSegments.*.text')
            .optional()
            .isLength({ min: 1, max: 4000 })
            .withMessage('Transcript segment text must be between 1 and 4000 characters')
            .trim(),
        body('transcriptSegments.*.start')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Transcript segment start must be a positive number'),
        body('transcriptSegments.*.end')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Transcript segment end must be a positive number'),
    ];

    static listRules = [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
        query('platform').optional().isIn(['youtube', 'google_drive', 'direct_video', 'unknown']),
        query('status').optional().isIn(['ready', 'transcript_required', 'processing_failed']),
        query('search').optional().isLength({ min: 1, max: 100 }).trim(),
    ];

    static askRules = [
        ...PublicVideoValidator.idRules,
        body('question')
            .notEmpty()
            .withMessage('Question is required')
            .isLength({ min: 2, max: 1000 })
            .withMessage('Question must be between 2 and 1000 characters')
            .trim(),
        body('history')
            .optional()
            .isArray({ max: 12 })
            .withMessage('History must be an array with at most 12 messages'),
    ];
}

export default PublicVideoValidator;
