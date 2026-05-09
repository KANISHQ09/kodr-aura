/**
 * Public Video Contract
 * Purpose: Define repository methods for public-link video analysis.
 * SRS Reference: FR-01.2, FR-02.4, FR-04.1
 */
/* eslint-disable no-unused-vars */
class PublicVideoContract {
    async create(data) {
        throw new Error('Method not implemented: create');
    }

    async findById(id) {
        throw new Error('Method not implemented: findById');
    }

    async findBySourceUrl(sourceUrl) {
        throw new Error('Method not implemented: findBySourceUrl');
    }

    async findAll(filters) {
        throw new Error('Method not implemented: findAll');
    }

    async updateById(id, data) {
        throw new Error('Method not implemented: updateById');
    }

    async appendQuestionAnswer(id, qaRecord) {
        throw new Error('Method not implemented: appendQuestionAnswer');
    }

    async clearQuestionAnswers(id) {
        throw new Error('Method not implemented: clearQuestionAnswers');
    }

    async deleteById(id) {
        throw new Error('Method not implemented: deleteById');
    }
}

export default PublicVideoContract;
