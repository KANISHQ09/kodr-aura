/**
 * Video Service
 * Purpose: Business logic for uploaded video storage, analysis, summary, and Q&A.
 * SRS Reference: FR-01.6, FR-02.4, FR-04.1
 */
import path from 'path';
import { randomUUID } from 'crypto';

import config from '../config/config.js';
import { createVideoProcessingQueue } from '../queues/videoProcessing.queue.js';
import { createStorageProvider } from './storage.service.js';
import appError from '../utils/appError.js';

class VideoService {
    constructor(
        repository,
        analysisService,
        cache,
        storageProvider = createStorageProvider(),
        videoProcessingQueue = createVideoProcessingQueue()
    ) {
        this.repository = repository;
        this.analysisService = analysisService;
        this.cache = cache;
        this.storageProvider = storageProvider;
        this.videoProcessingQueue = videoProcessingQueue;
    }

    async upload({ fileBuffer, title, originalName, mimeType, transcriptText, transcriptSegments }) {
        await this.assertUploadLimit();

        if (!fileBuffer || fileBuffer.length === 0) {
            throw appError('Video file is required', 400);
        }

        const extension = this.resolveExtension(originalName, mimeType);
        const fileName = `${randomUUID()}${extension}`;
        const storageResult = await this.storageProvider.upload({
            fileBuffer,
            fileName,
            mimeType,
        });

        const prepared = await this.prepareAnalysis({
            title: title || originalName || 'Uploaded video',
            transcriptText,
            transcriptSegments,
        });

        const video = await this.repository.create({
            title: prepared.title,
            originalName,
            mimeType,
            sizeBytes: fileBuffer.length,
            ...storageResult,
            ...prepared.analysisFields,
        });

        if (prepared.analysisFields.status === 'transcript_required') {
            return this.enqueueVideoProcessing(video, storageResult);
        }

        await this.warmRuntimeState(video);
        return video;
    }

    async createFromTranscript(data) {
        await this.assertUploadLimit();

        const prepared = await this.prepareAnalysis({
            title: data.title,
            transcriptText: data.transcriptText,
            transcriptSegments: data.transcriptSegments,
        });

        const video = await this.repository.create({
            title: prepared.title,
            originalName: data.originalName,
            mimeType: data.mimeType,
            sizeBytes: data.sizeBytes || 0,
            ...prepared.analysisFields,
        });

        await this.warmRuntimeState(video);
        return video;
    }

    async list(query) {
        return this.repository.findAll(query);
    }

    async getById(id) {
        const video = await this.repository.findById(id);
        if (!video) throw appError('Video not found', 404);

        return video;
    }

    async getSummary(id) {
        const cacheKey = `video:${id}:summary`;
        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;

        const video = await this.getRuntimeState(id);
        const summary = {
            summary: video.summary,
            topicBreakdown: video.topicBreakdown,
        };

        await this.cache.set(cacheKey, summary, 300);
        return summary;
    }

    async attachTranscript(id, { transcriptText, transcriptSegments }) {
        const video = await this.getById(id);
        const prepared = await this.prepareAnalysis({
            title: video.title,
            transcriptText,
            transcriptSegments,
        });

        if (prepared.analysisFields.status !== 'ready') {
            throw appError('Transcript text or transcriptSegments are required', 400);
        }

        await this.cache.invalidatePattern(`video:${id}`);

        const updatedVideo = await this.repository.updateById(id, prepared.analysisFields);
        await this.warmRuntimeState(updatedVideo);

        return updatedVideo;
    }

    async getLastFiveMinutes(id) {
        const video = await this.getRuntimeState(id);
        return this.analysisService.summarizeLastMinutes(video.chunks || [], 5);
    }

    async ask(id, { question, history = [] }) {
        const video = await this.getRuntimeState(id);
        if (video.status === 'processing') {
            throw appError('Video is still being processed. Please try again after transcription completes.', 409);
        }

        if (!Array.isArray(video.chunks) || video.chunks.length === 0) {
            throw appError('Transcript is required before asking questions about this video', 422);
        }

        const result = await this.analysisService.answerQuestion({
            question,
            chunks: video.chunks,
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
        const video = await this.repository.clearQuestionAnswers(id);
        if (!video) throw appError('Video not found', 404);

        return {
            id,
            cleared: true,
        };
    }

    async getPlaybackUrl(id) {
        const video = await this.repository.findStorageById(id);
        if (!video) throw appError('Video not found', 404);

        const provider = createStorageProvider(video.storageProvider);
        const result = await provider.getReadUrl({
            storagePath: video.storagePath,
            storageKey: video.storageKey,
            storageUrl: video.storageUrl,
            publicUrl: video.publicUrl,
        });

        return {
            id,
            title: video.title,
            ...result,
        };
    }

    async delete(id) {
        const storedVideo = await this.repository.findStorageById(id);
        const video = await this.repository.deleteById(id);
        if (!video) throw appError('Video not found', 404);

        await this.cache.invalidatePattern(`video:${id}`);

        const provider = createStorageProvider(storedVideo?.storageProvider);
        await provider.deleteObject({
            storagePath: storedVideo?.storagePath,
            storageKey: storedVideo?.storageKey,
        });

        return video;
    }

    async prepareAnalysis({ title, transcriptText, transcriptSegments }) {
        const normalizedSegments = this.analysisService.normalizeSegments({
            transcriptSegments,
            transcriptText,
        });
        const chunks = this.analysisService.buildChunks(normalizedSegments);
        const hasTranscript = chunks.length > 0;
        const summary = hasTranscript
            ? await this.analysisService.summarize({ title, chunks })
            : null;
        const topicBreakdown = hasTranscript
            ? this.analysisService.buildTopicBreakdown(chunks)
            : [];

        return {
            title,
            analysisFields: {
                status: hasTranscript ? 'ready' : 'transcript_required',
                transcriptSegments: normalizedSegments,
                chunks,
                summary,
                topicBreakdown,
            },
        };
    }

    async enqueueVideoProcessing(video, storageResult) {
        let job = null;

        try {
            job = await this.videoProcessingQueue.enqueueTranscriptionJob({
                videoId: video._id,
                storageProvider: storageResult.storageProvider,
                storageKey: storageResult.storageKey,
                storageUrl: storageResult.storageUrl,
                mimeType: video.mimeType,
            });
        } catch {
            const updatedVideo = await this.repository.updateById(video._id, {
                processingJob: {
                    status: 'queue_failed',
                    updatedAt: new Date(),
                },
            });

            await this.warmRuntimeState(updatedVideo);
            return updatedVideo;
        }

        if (!job) {
            await this.warmRuntimeState(video);
            return video;
        }

        const updatedVideo = await this.repository.setProcessingJob(video._id, {
            jobId: String(job.id),
            queueName: job.queueName,
            status: 'queued',
            updatedAt: new Date(),
        });

        await this.warmRuntimeState(updatedVideo);
        return updatedVideo;
    }

    async getRuntimeState(id) {
        const cacheKey = this.runtimeCacheKey(id);
        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;

        const video = await this.getById(id);
        await this.warmRuntimeState(video);

        return this.toRuntimeState(video);
    }

    async warmRuntimeState(video) {
        if (!video?._id) return;

        await this.cache.set(
            this.runtimeCacheKey(video._id),
            this.toRuntimeState(video),
            config.VIDEO_RUNTIME_CACHE_TTL_SECONDS
        );
    }

    toRuntimeState(video) {
        return {
            id: String(video._id),
            status: video.status,
            processingJob: video.processingJob || null,
            chunks: video.chunks || [],
            summary: video.summary || null,
            topicBreakdown: video.topicBreakdown || [],
        };
    }

    runtimeCacheKey(id) {
        return `video:${id}:runtime`;
    }

    async assertUploadLimit() {
        const activeCount = await this.repository.countActive();
        if (activeCount >= config.MAX_UPLOADED_VIDEOS) {
            throw appError(`Only ${config.MAX_UPLOADED_VIDEOS} uploaded videos are allowed`, 409);
        }
    }

    resolveExtension(originalName = '', mimeType = '') {
        const existingExtension = path.extname(originalName);
        if (existingExtension) return existingExtension.toLowerCase();

        const extensionByMimeType = {
            'video/mp4': '.mp4',
            'video/quicktime': '.mov',
            'video/webm': '.webm',
            'video/x-msvideo': '.avi',
        };

        return extensionByMimeType[mimeType] || '.bin';
    }
}

export default VideoService;
