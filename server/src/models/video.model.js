/**
 * Video Model
 * Purpose: Store uploaded video metadata, transcript chunks, summaries, and Q&A history.
 * SRS Reference: FR-01.6, FR-02.1, FR-04.1
 */
import mongoose from 'mongoose';

const transcriptSegmentSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 4000,
        },
        start: {
            type: Number,
            required: true,
            min: 0,
        },
        end: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const transcriptChunkSchema = new mongoose.Schema(
    {
        chunkId: {
            type: String,
            required: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 8000,
        },
        start: {
            type: Number,
            required: true,
            min: 0,
        },
        end: {
            type: Number,
            required: true,
            min: 0,
        },
        keywords: {
            type: [String],
            default: [],
        },
    },
    { _id: false }
);

const qaSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        answer: {
            type: String,
            required: true,
            trim: true,
            maxlength: 8000,
        },
        timestamps: {
            type: [
                {
                    display: String,
                    seconds: Number,
                },
            ],
            default: [],
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const processingJobSchema = new mongoose.Schema(
    {
        jobId: {
            type: String,
            trim: true,
            maxlength: 200,
        },
        queueName: {
            type: String,
            trim: true,
            maxlength: 200,
        },
        status: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const videoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
            index: true,
        },
        originalName: {
            type: String,
            trim: true,
            maxlength: 255,
        },
        mimeType: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        sizeBytes: {
            type: Number,
            default: 0,
            min: 0,
        },
        storagePath: {
            type: String,
            trim: true,
            maxlength: 1000,
            select: false,
        },
        storageProvider: {
            type: String,
            enum: ['local', 'google_cloud'],
            default: 'local',
            index: true,
        },
        storageKey: {
            type: String,
            trim: true,
            maxlength: 1000,
            select: false,
        },
        storageUrl: {
            type: String,
            trim: true,
            maxlength: 2000,
            select: false,
        },
        publicUrl: {
            type: String,
            trim: true,
            maxlength: 2000,
            select: false,
        },
        status: {
            type: String,
            enum: ['ready', 'processing', 'transcript_required', 'processing_failed'],
            default: 'transcript_required',
            index: true,
        },
        processingJob: {
            type: processingJobSchema,
            default: null,
        },
        transcriptSegments: {
            type: [transcriptSegmentSchema],
            default: [],
        },
        chunks: {
            type: [transcriptChunkSchema],
            default: [],
        },
        summary: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        topicBreakdown: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
        },
        qaHistory: {
            type: [qaSchema],
            default: [],
        },
    },
    { timestamps: true }
);

videoSchema.index({ status: 1, createdAt: -1 });
videoSchema.index({ title: 1, status: 1 });

const Video = mongoose.model('Video', videoSchema);

export default Video;
