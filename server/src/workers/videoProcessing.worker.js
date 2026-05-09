/**
 * Video Processing Worker
 * Purpose: Consume BullMQ jobs for slow video processing tasks.
 *
 * This worker is intentionally separate from the API server. Run it with:
 * npm run worker:video
 */
import { Worker } from 'bullmq';

import connectedToDatabase from '../config/db.js';
import config from '../config/config.js';
import logger from '../loggers/winston.logger.js';
import Video from '../models/video.model.js';
import cache from '../utils/cache.js';
import { parseRedisUrl } from '../utils/redisConnection.js';

await connectedToDatabase();

const worker = new Worker(
    config.VIDEO_PROCESSING_QUEUE_NAME,
    async (job) => {
        if (job.name !== 'transcribe-uploaded-video') {
            logger.warn(`Unknown video processing job received: ${job.name}`);
            return { skipped: true };
        }

        const { videoId } = job.data;

        await Video.findByIdAndUpdate(videoId, {
            status: 'transcript_required',
            processingJob: {
                jobId: String(job.id),
                queueName: job.queueName,
                status: 'waiting_for_transcription_worker',
                updatedAt: new Date(),
            },
        });
        await cache.invalidatePattern(`video:${videoId}`);

        logger.info(`Queued video ${videoId} is waiting for transcription worker integration`);

        return {
            videoId,
            status: 'waiting_for_transcription_worker',
        };
    },
    {
        connection: parseRedisUrl(config.BULLMQ_REDIS_URL),
        concurrency: 2,
    }
);

worker.on('completed', (job) => {
    logger.info(`Video processing job completed: ${job.id}`);
});

worker.on('failed', async (job, error) => {
    logger.error(`Video processing job failed: ${job?.id}`, {
        error: error.message,
    });

    if (job?.data?.videoId) {
        await Video.findByIdAndUpdate(job.data.videoId, {
            status: 'processing_failed',
            processingJob: {
                jobId: String(job.id),
                queueName: job.queueName,
                status: 'failed',
                updatedAt: new Date(),
            },
        }).catch(() => null);
        await cache.invalidatePattern(`video:${job.data.videoId}`).catch(() => null);
    }
});
