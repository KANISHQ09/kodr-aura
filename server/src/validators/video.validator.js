/**
 * Video Validator
 * Purpose: Validate uploaded video metadata, query params, and Q&A requests.
 * SRS Reference: FR-01.6, FR-02.4, FR-04.1
 */
import { body, header, param, query } from 'express-validator';

class VideoValidator {
    static idRules = [
        param('id').isMongoId().withMessage('Valid video id is required'),
    ];

    static uploadRules = [
        header('content-type')
            .matches(/^(video\/(mp4|quicktime|webm|x-msvideo)|application\/octet-stream)/)
            .withMessage('Upload content-type must be a supported video type or application/octet-stream'),
        query('title')
            .optional()
            .isLength({ min: 1, max: 200 })
            .withMessage('Title must be between 1 and 200 characters')
            .trim(),
        query('fileName')
            .optional()
            .isLength({ min: 1, max: 255 })
            .withMessage('File name must be between 1 and 255 characters')
            .trim(),
    ];

    static createRules = [
        body('title')
            .notEmpty()
            .withMessage('Title is required')
            .isLength({ min: 1, max: 200 })
            .withMessage('Title must be between 1 and 200 characters')
            .trim(),
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
        query('status').optional().isIn(['ready', 'processing', 'transcript_required', 'processing_failed']),
        query('search').optional().isLength({ min: 1, max: 100 }).trim(),
    ];

    static askRules = [
        ...VideoValidator.idRules,
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

    static transcriptRules = [
        ...VideoValidator.idRules,
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
}

export default VideoValidator;
