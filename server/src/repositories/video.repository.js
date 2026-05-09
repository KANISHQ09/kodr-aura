/**
 * Video Repository
 * Purpose: Encapsulate MongoDB queries for uploaded videos.
 * SRS Reference: FR-01.6, FR-02.1, FR-04.1
 */
import VideoContract from '../contracts/video.contract.js';

class VideoRepository extends VideoContract {
    constructor(model) {
        super();
        this.model = model;
        this.listProjection = 'title originalName mimeType sizeBytes status processingJob summary createdAt updatedAt';
    }

    async create(data) {
        const document = await this.model.create(data);
        return document.toObject();
    }

    async findById(id) {
        return this.model.findById(id).lean();
    }

    async findStorageById(id) {
        return this.model
            .findById(id)
            .select('+storagePath +storageKey +storageUrl +publicUrl storageProvider title')
            .lean();
    }

    async findAll({ status, search, page = 1, limit = 20 }) {
        const filter = {};

        if (status) filter.status = status;
        if (search) filter.title = { $regex: search, $options: 'i' };

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.model
                .find(filter)
                .select(this.listProjection)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.model.countDocuments(filter),
        ]);

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async countActive() {
        return this.model.countDocuments({ status: { $ne: 'processing_failed' } });
    }

    async updateById(id, data) {
        return this.model
            .findByIdAndUpdate(id, data, { new: true, runValidators: true })
            .lean();
    }

    async appendQuestionAnswer(id, qaRecord) {
        return this.model
            .findByIdAndUpdate(
                id,
                { $push: { qaHistory: qaRecord } },
                { new: true, runValidators: true }
            )
            .lean();
    }

    async setProcessingJob(id, processingJob) {
        return this.model
            .findByIdAndUpdate(
                id,
                {
                    $set: {
                        status: 'processing',
                        processingJob,
                    },
                },
                { new: true, runValidators: true }
            )
            .lean();
    }

    async clearQuestionAnswers(id) {
        return this.model
            .findByIdAndUpdate(
                id,
                { $set: { qaHistory: [] } },
                { new: true, runValidators: true }
            )
            .lean();
    }

    async deleteById(id) {
        return this.model.findByIdAndDelete(id).lean();
    }
}

export default VideoRepository;
