/**
 * Video Contract
 * Purpose: Define repository methods for uploaded videos.
 * SRS Reference: FR-01.6, FR-02.4, FR-04.1
 */
/* eslint-disable no-unused-vars */
class VideoContract {
    async create(data) {
        throw new Error('Method not implemented: create');
    }

    async findById(id) {
        throw new Error('Method not implemented: findById');
    }

    async findStorageById(id) {
        throw new Error('Method not implemented: findStorageById');
    }

    async findAll(filters) {
        throw new Error('Method not implemented: findAll');
    }

    async countActive() {
        throw new Error('Method not implemented: countActive');
    }

    async updateById(id, data) {
        throw new Error('Method not implemented: updateById');
    }

    async appendQuestionAnswer(id, qaRecord) {
        throw new Error('Method not implemented: appendQuestionAnswer');
    }

    async setProcessingJob(id, processingJob) {
        throw new Error('Method not implemented: setProcessingJob');
    }

    async clearQuestionAnswers(id) {
        throw new Error('Method not implemented: clearQuestionAnswers');
    }

    async deleteById(id) {
        throw new Error('Method not implemented: deleteById');
    }
}

export default VideoContract;
