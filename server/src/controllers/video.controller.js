/**
 * Video Controller
 * Purpose: HTTP handlers for uploaded video library, summaries, and Q&A.
 * SRS Reference: FR-01.6, FR-02.4, FR-04.1
 */
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';

class VideoController {
    constructor(service) {
        this.service = service;
    }

    upload = asyncHandler(async (req, res) => {
        const video = await this.service.upload({
            fileBuffer: req.body,
            title: req.query.title || req.headers['x-video-title'],
            originalName: req.query.fileName || req.headers['x-file-name'] || 'uploaded-video',
            mimeType: req.headers['content-type'],
            transcriptText: req.headers['x-transcript-text'],
        });

        res.status(201).json(ApiResponse.success(video, 'Video uploaded successfully', 201));
    });

    createFromTranscript = asyncHandler(async (req, res) => {
        const video = await this.service.createFromTranscript(req.body);
        res.status(201).json(ApiResponse.success(video, 'Video transcript registered successfully', 201));
    });

    list = asyncHandler(async (req, res) => {
        const result = await this.service.list(req.query);
        res.status(200).json(ApiResponse.success(result, 'Videos fetched successfully'));
    });

    getById = asyncHandler(async (req, res) => {
        const video = await this.service.getById(req.params.id);
        res.status(200).json(ApiResponse.success(video, 'Video fetched successfully'));
    });

    getPlaybackUrl = asyncHandler(async (req, res) => {
        const playback = await this.service.getPlaybackUrl(req.params.id);
        res.status(200).json(ApiResponse.success(playback, 'Video playback URL fetched successfully'));
    });

    getSummary = asyncHandler(async (req, res) => {
        const summary = await this.service.getSummary(req.params.id);
        res.status(200).json(ApiResponse.success(summary, 'Video summary fetched successfully'));
    });

    attachTranscript = asyncHandler(async (req, res) => {
        const video = await this.service.attachTranscript(req.params.id, req.body);
        res.status(200).json(ApiResponse.success(video, 'Video transcript attached successfully'));
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
        res.status(200).json(ApiResponse.success(null, 'Video deleted successfully'));
    });
}

export default VideoController;
