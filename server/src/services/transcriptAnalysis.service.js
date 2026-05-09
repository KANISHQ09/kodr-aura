/**
 * Transcript Analysis Service
 * Purpose: Chunk transcripts, generate grounded summaries, and answer questions with timestamps.
 * SRS Reference: FR-02.1, FR-02.4, FR-02.7, FR-04.2
 */
import config from '../config/config.js';
import videoAssistantPrompt from '../lib/prompt/ai-video.js';

class TranscriptAnalysisService {
    constructor() {
        this.stopWords = new Set([
            'a',
            'an',
            'and',
            'are',
            'as',
            'at',
            'be',
            'by',
            'for',
            'from',
            'has',
            'he',
            'in',
            'is',
            'it',
            'its',
            'of',
            'on',
            'or',
            'that',
            'the',
            'this',
            'to',
            'was',
            'were',
            'will',
            'with',
            'you',
            'your',
        ]);
    }

    normalizeSegments({ transcriptSegments = [], transcriptText = '' }) {
        if (Array.isArray(transcriptSegments) && transcriptSegments.length > 0) {
            return transcriptSegments
                .map((segment, index) => ({
                    text: String(segment.text || '').trim(),
                    start: Number(segment.start ?? index * 15),
                    end: Number(segment.end ?? index * 15 + 15),
                }))
                .filter((segment) => segment.text.length > 0 && segment.end >= segment.start);
        }

        if (!transcriptText || typeof transcriptText !== 'string') return [];

        const sentences = transcriptText
            .split(/(?<=[.!?])\s+/)
            .map((sentence) => sentence.trim())
            .filter(Boolean);

        return sentences.map((sentence, index) => ({
            text: sentence,
            start: index * 12,
            end: index * 12 + 12,
        }));
    }

    buildChunks(segments, wordsPerChunk = 200, overlapWords = 40) {
        const chunks = [];
        let bucket = [];
        let start = 0;
        let end = 0;
        let chunkIndex = 0;

        for (const segment of segments) {
            if (bucket.length === 0) start = segment.start;

            bucket.push(segment.text);
            end = segment.end;

            if (this.countWords(bucket.join(' ')) >= wordsPerChunk) {
                chunks.push(this.createChunk(bucket.join(' '), start, end, chunkIndex));
                chunkIndex += 1;
                bucket = this.lastWords(bucket.join(' '), overlapWords);
                start = Math.max(0, end - 30);
            }
        }

        if (bucket.length > 0) {
            chunks.push(this.createChunk(bucket.join(' '), start, end, chunkIndex));
        }

        return chunks;
    }

    async summarize({ title, chunks }) {
        if (!chunks || chunks.length === 0) {
            return {
                overallTopic: title,
                estimatedReadingTime: '1 min',
                keyPoints: [],
                summaryText: 'Transcript is not available yet.',
            };
        }

        const aiSummary = await this.generateWithOpenAi({
            task: 'summary',
            title,
            context: chunks.slice(0, 12).map((chunk) => this.toContextLine(chunk)).join('\n'),
        });

        if (aiSummary) return aiSummary;

        const keyPoints = chunks.slice(0, 8).map((chunk) => ({
            text: this.compactText(chunk.text, 220),
            timestampRange: `${this.formatTime(chunk.start)}-${this.formatTime(chunk.end)}`,
            start: chunk.start,
            end: chunk.end,
        }));

        return {
            overallTopic: title,
            estimatedReadingTime: `${Math.max(1, Math.ceil(this.countWords(chunks.map((chunk) => chunk.text).join(' ')) / 220))} min`,
            keyPoints,
            summaryText: keyPoints.map((point) => `[${point.timestampRange}] ${point.text}`).join('\n'),
        };
    }

    buildTopicBreakdown(chunks) {
        return chunks.slice(0, 12).map((chunk, index) => ({
            topic: this.createTopicLabel(chunk, index),
            timestampRange: `${this.formatTime(chunk.start)}-${this.formatTime(chunk.end)}`,
            start: chunk.start,
            end: chunk.end,
            preview: this.compactText(chunk.text, 180),
        }));
    }

    summarizeLastMinutes(chunks, minutes = 5) {
        if (!chunks || chunks.length === 0) {
            return {
                timestampRange: null,
                recap: 'Transcript is not available yet.',
                keyMoments: [],
            };
        }

        const videoEnd = Math.max(...chunks.map((chunk) => chunk.end));
        const startWindow = Math.max(0, videoEnd - minutes * 60);
        const selectedChunks = chunks.filter((chunk) => chunk.end >= startWindow);

        return {
            timestampRange: `${this.formatTime(startWindow)}-${this.formatTime(videoEnd)}`,
            recap: selectedChunks.map((chunk) => this.compactText(chunk.text, 180)).join(' '),
            keyMoments: selectedChunks.slice(0, 5).map((chunk) => ({
                text: this.compactText(chunk.text, 160),
                timestamp: this.formatTime(chunk.start),
                seconds: chunk.start,
            })),
        };
    }

    async answerQuestion({ question, chunks, history = [] }) {
        const relevantChunks = this.searchRelevantChunks(question, chunks, 5);

        if (relevantChunks.length === 0) {
            return {
                answer: 'This topic is not covered in the video',
                timestamps: [],
                context: [],
            };
        }

        const aiAnswer = await this.generateWithOpenAi({
            task: 'answer',
            question,
            history,
            context: relevantChunks.map((chunk) => this.toContextLine(chunk)).join('\n'),
        });

        if (aiAnswer?.answer) {
            return {
                answer: aiAnswer.answer,
                timestamps: this.extractTimestampLinks(aiAnswer.answer),
                context: relevantChunks,
            };
        }

        const answer = relevantChunks
            .map((chunk) => `[${this.formatTime(chunk.start)}] ${this.compactText(chunk.text, 260)}`)
            .join('\n');

        return {
            answer,
            timestamps: relevantChunks.map((chunk) => ({
                display: this.formatTime(chunk.start),
                seconds: chunk.start,
            })),
            context: relevantChunks,
        };
    }

    searchRelevantChunks(question, chunks, limit = 5) {
        const questionTokens = this.keywords(question);
        if (questionTokens.length === 0) return [];

        return chunks
            .map((chunk) => ({
                ...chunk,
                score: this.scoreChunk(questionTokens, chunk),
            }))
            .filter((chunk) => chunk.score > 0)
            .sort((left, right) => right.score - left.score)
            .slice(0, limit);
    }

    createChunk(text, start, end, index) {
        const cleanText = text.replace(/\s+/g, ' ').trim();

        return {
            chunkId: `chunk_${index + 1}`,
            text: cleanText,
            start,
            end,
            keywords: this.keywords(cleanText).slice(0, 20),
        };
    }

    keywords(text) {
        return String(text)
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((word) => word.length > 2 && !this.stopWords.has(word));
    }

    scoreChunk(questionTokens, chunk) {
        const chunkTokens = new Set(chunk.keywords?.length ? chunk.keywords : this.keywords(chunk.text));
        return questionTokens.reduce((score, token) => score + (chunkTokens.has(token) ? 1 : 0), 0);
    }

    countWords(text) {
        return String(text).trim().split(/\s+/).filter(Boolean).length;
    }

    lastWords(text, count) {
        const words = text.split(/\s+/).filter(Boolean).slice(-count);
        return words.length > 0 ? [words.join(' ')] : [];
    }

    compactText(text, maxLength) {
        const cleanText = String(text).replace(/\s+/g, ' ').trim();
        if (cleanText.length <= maxLength) return cleanText;
        return `${cleanText.slice(0, maxLength - 3).trim()}...`;
    }

    createTopicLabel(chunk, index) {
        const keywords = chunk.keywords?.slice(0, 3) || [];
        if (keywords.length === 0) return `Topic ${index + 1}`;

        return keywords
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' / ');
    }

    toContextLine(chunk) {
        return `[${this.formatTime(chunk.start)}-${this.formatTime(chunk.end)}] ${chunk.text}`;
    }

    formatTime(seconds) {
        const totalSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        if (hours > 0) {
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }

        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    extractTimestampLinks(text) {
        const matches = [...String(text).matchAll(/\[(\d{1,2}:)?\d{1,2}:\d{2}\]/g)];

        return matches.map((match) => {
            const display = match[0].replace('[', '').replace(']', '');
            const parts = display.split(':').map(Number);
            const seconds = parts.length === 3
                ? parts[0] * 3600 + parts[1] * 60 + parts[2]
                : parts[0] * 60 + parts[1];

            return { display, seconds };
        });
    }

    async generateWithOpenAi({ task, title, question, history = [], context }) {
        if (!config.OPENAI_API_KEY || config.AI_PROVIDER !== 'openai') return null;

        const messages = this.buildOpenAiMessages({ task, title, question, history, context });

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${config.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: config.OPENAI_MODEL,
                    temperature: 0.2,
                    response_format: { type: 'json_object' },
                    messages,
                }),
            });

            if (!response.ok) return null;

            const payload = await response.json();
            const content = payload.choices?.[0]?.message?.content;
            if (!content) return null;

            return JSON.parse(content);
        } catch {
            return null;
        }
    }

    buildOpenAiMessages({ task, title, question, history, context }) {
        if (task === 'summary') {
            return [
                { role: 'system', content: videoAssistantPrompt },
                {
                    role: 'user',
                    content: `Create a transcript-grounded video summary using the required JSON shape from the system instructions. Title: ${title}. Context:\n${context}`,
                },
            ];
        }

        return [
            { role: 'system', content: videoAssistantPrompt },
            ...history.slice(-6),
            {
                role: 'user',
                content: `Answer the user's video question using the required JSON answer shape from the system instructions. Question: ${question}. Context:\n${context}`,
            },
        ];
    }
}

export default TranscriptAnalysisService;
