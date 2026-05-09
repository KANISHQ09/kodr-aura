/**
 * Video Assistant Validator
 * Purpose: Validate embeddable video transcript, Q&A, summary, playback,
 * and session endpoints.
 */
import { body, query } from 'express-validator';

class VideoAssistantValidator {
    static transcriptFields = [
        body('transcriptText')
            .optional()
            .isLength({ min: 1, max: 500000 })
            .withMessage('Transcript text is too large')
            .trim(),
        body('transcript')
            .optional()
            .isArray({ max: 10000 })
            .withMessage('transcript must be an array'),
        body('transcriptSegments')
            .optional()
            .isArray({ max: 10000 })
            .withMessage('transcriptSegments must be an array'),
        body(['transcript.*.text', 'transcriptSegments.*.text'])
            .optional()
            .isLength({ min: 1, max: 4000 })
            .withMessage('Transcript segment text must be between 1 and 4000 characters')
            .trim(),
        body(['transcript.*.start', 'transcriptSegments.*.start'])
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Transcript segment start must be a positive number'),
        body(['transcript.*.end', 'transcriptSegments.*.end'])
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Transcript segment end must be a positive number'),
    ];

    static transcribeRules = [
        body(['video_url', 'sourceUrl'])
            .optional()
            .isURL({ require_protocol: true })
            .withMessage('video_url/sourceUrl must be a URL with protocol')
            .isLength({ max: 2000 })
            .withMessage('video_url/sourceUrl is too long')
            .trim(),
        body('title')
            .optional()
            .isLength({ min: 1, max: 200 })
            .withMessage('Title must be between 1 and 200 characters')
            .trim(),
        body('forceRefresh').optional().isBoolean().toBoolean(),
        ...VideoAssistantValidator.transcriptFields,
    ];

    static chunkIndexRules = [
        body('title')
            .optional()
            .isLength({ min: 1, max: 200 })
            .withMessage('Title must be between 1 and 200 characters')
            .trim(),
        ...VideoAssistantValidator.transcriptFields,
    ];

    static askRules = [
        body('transcript_id')
            .notEmpty()
            .withMessage('transcript_id is required')
            .isMongoId()
            .withMessage('Valid transcript_id is required'),
        body('source_type')
            .optional()
            .isIn(['uploaded_video', 'video', 'public_video', 'public'])
            .withMessage('source_type must be uploaded_video or public_video'),
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

    static summaryRules = [
        query('transcript_id')
            .notEmpty()
            .withMessage('transcript_id is required')
            .isMongoId()
            .withMessage('Valid transcript_id is required'),
        query('source_type')
            .optional()
            .isIn(['uploaded_video', 'video', 'public_video', 'public'])
            .withMessage('source_type must be uploaded_video or public_video'),
    ];

    static playbackUrlRules = [
        query('transcript_id')
            .notEmpty()
            .withMessage('transcript_id is required')
            .isMongoId()
            .withMessage('Valid transcript_id is required'),
        query('source_type')
            .optional()
            .isIn(['uploaded_video', 'video', 'public_video', 'public'])
            .withMessage('source_type must be uploaded_video or public_video'),
    ];

    static sessionRules = [
        body('transcript_id')
            .optional()
            .isMongoId()
            .withMessage('Valid transcript_id is required'),
        query('transcript_id')
            .optional()
            .isMongoId()
            .withMessage('Valid transcript_id is required'),
        body('source_type')
            .optional()
            .isIn(['uploaded_video', 'video', 'public_video', 'public'])
            .withMessage('source_type must be uploaded_video or public_video'),
        query('source_type')
            .optional()
            .isIn(['uploaded_video', 'video', 'public_video', 'public'])
            .withMessage('source_type must be uploaded_video or public_video'),
        body('deleteTranscript').optional().isBoolean().toBoolean(),
        query('deleteTranscript').optional().isBoolean().toBoolean(),
    ];
}

export default VideoAssistantValidator;
