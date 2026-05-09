/**
 * Public Video Service
 * Purpose: Business logic for public-link transcript analysis, summary, and Q&A.
 * SRS Reference: FR-01.1, FR-01.2, FR-02.4, FR-04.1
 */
import config from '../config/config.js';
import appError from '../utils/appError.js';

class PublicVideoService {
    constructor(repository, analysisService, transcriptService, cache) {
        this.repository = repository;
        this.analysisService = analysisService;
        this.transcriptService = transcriptService;
        this.cache = cache;
    }

    async analyzeLink({ sourceUrl, title, transcriptSegments, transcriptText, forceRefresh = false }) {
        const existing = await this.repository.findBySourceUrl(sourceUrl);
        if (existing && existing.status === 'ready' && !forceRefresh) {
            await this.warmRuntimeState(existing);
            return existing;
        }

        const transcriptResult = await this.transcriptService.fetchTranscript({
            sourceUrl,
            transcriptSegments,
            transcriptText,
        });
        const resolvedTitle = title || transcriptResult.title || 'Public video';
        const normalizedSegments = this.analysisService.normalizeSegments({
            transcriptSegments: transcriptResult.segments,
            transcriptText: transcriptResult.transcriptText,
        });
        const chunks = this.analysisService.buildChunks(normalizedSegments);
        const hasTranscript = chunks.length > 0;
        const summary = hasTranscript
            ? await this.analysisService.summarize({ title: resolvedTitle, chunks })
            : null;
        const topicBreakdown = hasTranscript
            ? this.analysisService.buildTopicBreakdown(chunks)
            : [];
        const data = {
            sourceUrl,
            platform: transcriptResult.source.platform,
            externalVideoId: transcriptResult.source.externalVideoId,
            title: resolvedTitle,
            status: hasTranscript ? 'ready' : 'transcript_required',
            transcriptSegments: normalizedSegments,
            chunks,
            summary,
            topicBreakdown,
            lastError: hasTranscript ? undefined : transcriptResult.error,
        };

        if (existing) {
            await this.cache.invalidatePattern(`public-video:${existing._id}`);
            const updatedAnalysis = await this.repository.updateById(existing._id, data);
            await this.warmRuntimeState(updatedAnalysis);

            return updatedAnalysis;
        }

        const analysis = await this.repository.create(data);
        await this.warmRuntimeState(analysis);

        return analysis;
    }

    async list(query) {
        return this.repository.findAll(query);
    }

    async getById(id) {
        const publicVideo = await this.repository.findById(id);
        if (!publicVideo) throw appError('Public video analysis not found', 404);

        return publicVideo;
    }

    async getSummary(id) {
        const cacheKey = `public-video:${id}:summary`;
        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;

        const publicVideo = await this.getRuntimeState(id);
        const summary = {
            summary: publicVideo.summary,
            topicBreakdown: publicVideo.topicBreakdown,
            status: publicVideo.status,
            lastError: publicVideo.lastError,
        };

        await this.cache.set(cacheKey, summary, 300);
        return summary;
    }

    async getLastFiveMinutes(id) {
        const publicVideo = await this.getRuntimeState(id);
        return this.analysisService.summarizeLastMinutes(publicVideo.chunks || [], 5);
    }

    async ask(id, { question, history = [] }) {
        const publicVideo = await this.getRuntimeState(id);
        if (!Array.isArray(publicVideo.chunks) || publicVideo.chunks.length === 0) {
            throw appError('Transcript is required before asking questions about this public video', 422);
        }

        const result = await this.analysisService.answerQuestion({
            question,
            chunks: publicVideo.chunks,
            history,
        });

        const qaRecord = {
            question,
            answer: result.answer,
            timestamps: result.timestamps,
        };

        await this.repository.appendQuestionAnswer(id, qaRecord);

        return {
            ...qaRecord,
            context: result.context.map((chunk) => ({
                chunkId: chunk.chunkId,
                start: chunk.start,
                end: chunk.end,
                text: chunk.text,
            })),
        };
    }

    async clearQuestionAnswers(id) {
        const publicVideo = await this.repository.clearQuestionAnswers(id);
        if (!publicVideo) throw appError('Public video analysis not found', 404);

        return {
            id,
            cleared: true,
        };
    }

    async delete(id) {
        const publicVideo = await this.repository.deleteById(id);
        if (!publicVideo) throw appError('Public video analysis not found', 404);

        await this.cache.invalidatePattern(`public-video:${id}`);
        return publicVideo;
    }

    async getRuntimeState(id) {
        const cacheKey = this.runtimeCacheKey(id);
        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;

        const publicVideo = await this.getById(id);
        await this.warmRuntimeState(publicVideo);

        return this.toRuntimeState(publicVideo);
    }

    async warmRuntimeState(publicVideo) {
        if (!publicVideo?._id) return;

        await this.cache.set(
            this.runtimeCacheKey(publicVideo._id),
            this.toRuntimeState(publicVideo),
            config.VIDEO_RUNTIME_CACHE_TTL_SECONDS
        );
    }

    toRuntimeState(publicVideo) {
        return {
            id: String(publicVideo._id),
            status: publicVideo.status,
            lastError: publicVideo.lastError,
            chunks: publicVideo.chunks || [],
            summary: publicVideo.summary || null,
            topicBreakdown: publicVideo.topicBreakdown || [],
        };
    }

    runtimeCacheKey(id) {
        return `public-video:${id}:runtime`;
    }
}

export default PublicVideoService;
