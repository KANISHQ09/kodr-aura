/**
 * Video Assistant Controller
 * Purpose: HTTP handlers for embeddable video transcript, summary, Q&A,
 * playback, and session endpoints.
 */
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

class VideoAssistantController {
    constructor(service) {
        this.service = service;
    }

    transcribe = asyncHandler(async (req, res) => {
        const result = await this.service.transcribe(req.body);
        res.status(201).json(ApiResponse.success(result, 'Transcript prepared successfully', 201));
    });

    chunkIndex = asyncHandler(async (req, res) => {
        const result = await this.service.chunkIndex(req.body);
        res.status(201).json(ApiResponse.success(result, 'Transcript chunks indexed successfully', 201));
    });

    ask = asyncHandler(async (req, res) => {
        const result = await this.service.ask(req.body);
        res.status(200).json(ApiResponse.success(result, 'Question answered successfully'));
    });

    askStream = asyncHandler(async (req, res) => {
        const result = await this.service.ask(req.body);

        res.writeHead(200, {
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'Content-Type': 'text/event-stream',
            'X-Accel-Buffering': 'no',
        });

        const words = result.answer.split(/(\s+)/).filter(Boolean);
        for (const word of words) {
            res.write(`event: token\ndata: ${JSON.stringify({ delta: word })}\n\n`);
        }

        res.write(`event: done\ndata: ${JSON.stringify(result)}\n\n`);
        res.end();
    });

    summary = asyncHandler(async (req, res) => {
        const result = await this.service.summary(req.query);
        res.status(200).json(ApiResponse.success(result, 'Summary fetched successfully'));
    });

    playbackUrl = asyncHandler(async (req, res) => {
        const result = await this.service.playbackUrl(req.query);
        res.status(200).json(ApiResponse.success(result, 'Playback URL fetched successfully'));
    });

    deleteSession = asyncHandler(async (req, res) => {
        const result = await this.service.deleteSession({
            ...req.query,
            ...req.body,
        });

        res.status(200).json(ApiResponse.success(result, 'Session cleared successfully'));
    });
}

export default VideoAssistantController;
