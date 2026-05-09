/**
 * Public Video Repository
 * Purpose: Encapsulate MongoDB queries for public-link analyses.
 * SRS Reference: FR-01.2, FR-02.4, FR-04.1
 */
import PublicVideoContract from '../contracts/publicVideo.contract.js';

class PublicVideoRepository extends PublicVideoContract {
    constructor(model) {
        super();
        this.model = model;
        this.listProjection = 'sourceUrl platform externalVideoId title status summary createdAt updatedAt lastError';
    }

    async create(data) {
        const document = await this.model.create(data);
        return document.toObject();
    }

    async findById(id) {
        return this.model.findById(id).lean();
    }

    async findBySourceUrl(sourceUrl) {
        return this.model.findOne({ sourceUrl }).lean();
    }

    async findAll({ platform, status, search, page = 1, limit = 20 }) {
        const filter = {};

        if (platform) filter.platform = platform;
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

export default PublicVideoRepository;
