/**
 * Video Processing Queue
 * Purpose: Enqueue slow uploaded-video processing tasks away from request handling.
 */
import { Queue } from 'bullmq';

import config from '../config/config.js';
import { parseRedisUrl } from '../utils/redisConnection.js';

class DisabledVideoProcessingQueue {
    async enqueueTranscriptionJob() {
        return null;
    }
}

class BullMqVideoProcessingQueue {
    constructor() {
        this.queue = new Queue(config.VIDEO_PROCESSING_QUEUE_NAME, {
            connection: parseRedisUrl(config.BULLMQ_REDIS_URL),
            defaultJobOptions: {
                attempts: config.VIDEO_PROCESSING_JOB_ATTEMPTS,
                backoff: {
                    type: 'exponential',
                    delay: config.VIDEO_PROCESSING_JOB_BACKOFF_MS,
                },
                removeOnComplete: {
                    age: 24 * 60 * 60,
                    count: 1000,
                },
                removeOnFail: {
                    age: 7 * 24 * 60 * 60,
                    count: 1000,
                },
            },
        });
    }

    async enqueueTranscriptionJob({ videoId, storageProvider, storageKey, storageUrl, mimeType }) {
        const job = await this.queue.add(
            'transcribe-uploaded-video',
            {
                videoId: String(videoId),
                storageProvider,
                storageKey,
                storageUrl,
                mimeType,
            },
            {
                jobId: `video:${videoId}:transcription`,
                priority: 5,
            }
        );

        return {
            id: job.id,
            name: job.name,
            queueName: job.queueName,
        };
    }
}

export const createVideoProcessingQueue = () => {
    if (config.QUEUE_PROVIDER !== 'bullmq') {
        return new DisabledVideoProcessingQueue();
    }

    return new BullMqVideoProcessingQueue();
};

export default createVideoProcessingQueue;
