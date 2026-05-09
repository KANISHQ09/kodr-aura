/**
 * Public Video Model
 * Purpose: Store analysed public-link video transcripts, summaries, and Q&A history.
 * SRS Reference: FR-01.2, FR-02.4, FR-04.1
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

const publicVideoSchema = new mongoose.Schema(
    {
        sourceUrl: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
            index: true,
        },
        platform: {
            type: String,
            enum: ['youtube', 'google_drive', 'direct_video', 'unknown'],
            default: 'unknown',
            index: true,
        },
        externalVideoId: {
            type: String,
            trim: true,
            maxlength: 200,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        status: {
            type: String,
            enum: ['ready', 'transcript_required', 'processing_failed'],
            default: 'transcript_required',
            index: true,
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
        lastError: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
    },
    { timestamps: true }
);

publicVideoSchema.index({ platform: 1, externalVideoId: 1 });
publicVideoSchema.index({ status: 1, createdAt: -1 });

const PublicVideo = mongoose.model('PublicVideo', publicVideoSchema);

export default PublicVideo;
