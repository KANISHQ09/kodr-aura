/**
 * Public Video Controller
 * Purpose: HTTP handlers for public-link video analysis, summaries, and Q&A.
 * SRS Reference: FR-01.1, FR-02.4, FR-04.1
 */
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';

class PublicVideoController {
    constructor(service) {
        this.service = service;
    }

    analyzeLink = asyncHandler(async (req, res) => {
        const analysis = await this.service.analyzeLink(req.body);
        res.status(201).json(ApiResponse.success(analysis, 'Public video analysed successfully', 201));
    });

    list = asyncHandler(async (req, res) => {
        const result = await this.service.list(req.query);
        res.status(200).json(ApiResponse.success(result, 'Public video analyses fetched successfully'));
    });

    getById = asyncHandler(async (req, res) => {
        const analysis = await this.service.getById(req.params.id);
        res.status(200).json(ApiResponse.success(analysis, 'Public video analysis fetched successfully'));
    });

    getSummary = asyncHandler(async (req, res) => {
        const summary = await this.service.getSummary(req.params.id);
        res.status(200).json(ApiResponse.success(summary, 'Public video summary fetched successfully'));
    });

    getLastFiveMinutes = asyncHandler(async (req, res) => {
        const recap = await this.service.getLastFiveMinutes(req.params.id);
        res.status(200).json(ApiResponse.success(recap, 'Last five minutes summary fetched successfully'));
    });

    ask = asyncHandler(async (req, res) => {
        const answer = await this.service.ask(req.params.id, req.body);
        res.status(200).json(ApiResponse.success(answer, 'Question answered successfully'));
    });

    delete = asyncHandler(async (req, res) => {
        await this.service.delete(req.params.id);
        res.status(200).json(ApiResponse.success(null, 'Public video analysis deleted successfully'));
    });
}

export default PublicVideoController;
