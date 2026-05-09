/**
 * Video Assistant Service
 * Purpose: Coordinate embeddable video assistant workflows across uploaded and public videos.
 */
import appError from '../utils/appError.js';

class VideoAssistantService {
    constructor(videoService, publicVideoService) {
        this.videoService = videoService;
        this.publicVideoService = publicVideoService;
    }

    async transcribe(payload) {
        const sourceUrl = payload.sourceUrl || payload.video_url;

        if (sourceUrl) {
            const analysis = await this.publicVideoService.analyzeLink({
                sourceUrl,
                title: payload.title,
                transcriptText: payload.transcriptText,
                transcriptSegments: payload.transcriptSegments || payload.transcript,
                forceRefresh: payload.forceRefresh,
            });

            return this.toTranscriptResponse(analysis, 'public_video');
        }

        const transcriptSegments = payload.transcriptSegments || payload.transcript;
        if (!payload.transcriptText && !Array.isArray(transcriptSegments)) {
            throw appError('video_url/sourceUrl or transcriptText/transcriptSegments is required', 400);
        }

        const video = await this.videoService.createFromTranscript({
            title: payload.title || 'Uploaded transcript',
            transcriptText: payload.transcriptText,
            transcriptSegments,
            originalName: payload.fileName || payload.originalName,
            mimeType: payload.mimeType,
            sizeBytes: payload.sizeBytes,
        });

        return this.toTranscriptResponse(video, 'uploaded_video');
    }

    async chunkIndex(payload) {
        const transcriptSegments = payload.transcriptSegments || payload.transcript;

        if (!payload.transcriptText && !Array.isArray(transcriptSegments)) {
            throw appError('transcriptText or transcript/transcriptSegments is required', 400);
        }

        const video = await this.videoService.createFromTranscript({
            title: payload.title || 'Indexed transcript',
            transcriptText: payload.transcriptText,
            transcriptSegments,
        });

        return {
            index_id: String(video._id),
            transcript_id: String(video._id),
            source_type: 'uploaded_video',
            status: video.status,
            chunk_count: video.chunks?.length || 0,
        };
    }

    async ask({ transcript_id, question, history = [], source_type }) {
        const session = await this.resolveSession(transcript_id, source_type);
        const result = await session.service.ask(transcript_id, { question, history });

        return {
            transcript_id,
            source_type: session.sourceType,
            answer: result.answer,
            timestamps: result.timestamps,
            context: result.context,
        };
    }

    async summary({ transcript_id, source_type }) {
        const session = await this.resolveSession(transcript_id, source_type);
        const result = await session.service.getSummary(transcript_id);

        return {
            transcript_id,
            source_type: session.sourceType,
            ...result,
        };
    }

    async playbackUrl({ transcript_id, source_type }) {
        const session = await this.resolveSession(transcript_id, source_type);
        if (session.sourceType !== 'uploaded_video') {
            throw appError('Playback URLs are only generated for uploaded videos', 400);
        }

        const result = await this.videoService.getPlaybackUrl(transcript_id);
        return {
            transcript_id,
            source_type: session.sourceType,
            ...result,
        };
    }

    async deleteSession({ transcript_id, source_type, deleteTranscript = false }) {
        const session = await this.resolveSession(transcript_id, source_type);

        if (deleteTranscript) {
            await session.service.delete(transcript_id);
            return {
                transcript_id,
                source_type: session.sourceType,
                deleted: true,
            };
        }

        await session.service.clearQuestionAnswers(transcript_id);
        return {
            transcript_id,
            source_type: session.sourceType,
            cleared: true,
        };
    }

    async resolveSession(id, sourceType) {
        if (!id) throw appError('transcript_id is required', 400);

        if (sourceType === 'uploaded_video' || sourceType === 'video') {
            await this.videoService.getById(id);
            return {
                service: this.videoService,
                sourceType: 'uploaded_video',
            };
        }

        if (sourceType === 'public_video' || sourceType === 'public') {
            await this.publicVideoService.getById(id);
            return {
                service: this.publicVideoService,
                sourceType: 'public_video',
            };
        }

        try {
            await this.videoService.getById(id);
            return {
                service: this.videoService,
                sourceType: 'uploaded_video',
            };
        } catch (error) {
            if (error.statusCode !== 404) throw error;
        }

        await this.publicVideoService.getById(id);
        return {
            service: this.publicVideoService,
            sourceType: 'public_video',
        };
    }

    toTranscriptResponse(record, sourceType) {
        return {
            transcript_id: String(record._id),
            index_id: String(record._id),
            source_type: sourceType,
            status: record.status,
            transcript: record.transcriptSegments || [],
            chunk_count: record.chunks?.length || 0,
            summary: record.summary,
            topicBreakdown: record.topicBreakdown || [],
            lastError: record.lastError,
        };
    }
}

export default VideoAssistantService;
