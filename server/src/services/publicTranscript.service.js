/**
 * Public Transcript Service
 * Purpose: Resolve public video links into timestamped transcript segments when possible.
 * SRS Reference: FR-01.1, FR-01.2, FR-01.4
 */
class PublicTranscriptService {
    detectSource(sourceUrl) {
        const url = new URL(sourceUrl);
        const host = url.hostname.replace(/^www\./, '');

        if (host === 'youtu.be' || host.endsWith('youtube.com')) {
            return {
                platform: 'youtube',
                externalVideoId: this.extractYouTubeId(url),
            };
        }

        if (host.endsWith('drive.google.com')) {
            return {
                platform: 'google_drive',
                externalVideoId: this.extractGoogleDriveId(url),
            };
        }

        if (/\.(mp4|mov|webm|avi)(\?.*)?$/i.test(url.pathname)) {
            return {
                platform: 'direct_video',
                externalVideoId: url.pathname.split('/').pop(),
            };
        }

        return {
            platform: 'unknown',
            externalVideoId: null,
        };
    }

    async fetchTranscript({ sourceUrl, transcriptSegments, transcriptText }) {
        if (Array.isArray(transcriptSegments) && transcriptSegments.length > 0) {
            return {
                segments: transcriptSegments,
                title: 'Public video',
                source: this.detectSource(sourceUrl),
            };
        }

        if (transcriptText) {
            return {
                segments: [],
                transcriptText,
                title: 'Public video',
                source: this.detectSource(sourceUrl),
            };
        }

        const source = this.detectSource(sourceUrl);

        if (source.platform === 'youtube' && source.externalVideoId) {
            return this.fetchYouTubeTranscript(sourceUrl, source);
        }

        return {
            segments: [],
            title: 'Public video',
            source,
            error: `${source.platform} links need transcriptSegments or transcriptText until a transcription worker is configured.`,
        };
    }

    async fetchYouTubeTranscript(sourceUrl, source) {
        const title = await this.fetchYouTubeTitle(sourceUrl);
        const languages = ['en', 'hi'];

        for (const language of languages) {
            const segments = await this.fetchYouTubeLanguage(source.externalVideoId, language);
            if (segments.length > 0) {
                return {
                    segments,
                    title,
                    source,
                };
            }
        }

        return {
            segments: [],
            title,
            source,
            error: 'No public YouTube captions were available for this video.',
        };
    }

    async fetchYouTubeLanguage(videoId, language) {
        const endpoint = new URL('https://www.youtube.com/api/timedtext');
        endpoint.searchParams.set('v', videoId);
        endpoint.searchParams.set('lang', language);
        endpoint.searchParams.set('fmt', 'json3');

        try {
            const response = await fetch(endpoint);
            if (!response.ok) return [];

            const payload = await response.json();
            const events = Array.isArray(payload.events) ? payload.events : [];

            return events
                .filter((event) => Array.isArray(event.segs))
                .map((event) => {
                    const text = event.segs
                        .map((segment) => segment.utf8 || '')
                        .join('')
                        .replace(/\s+/g, ' ')
                        .trim();
                    const start = Number(event.tStartMs || 0) / 1000;
                    const duration = Number(event.dDurationMs || 0) / 1000;

                    return {
                        text,
                        start,
                        end: start + duration,
                    };
                })
                .filter((segment) => segment.text.length > 0);
        } catch {
            return [];
        }
    }

    async fetchYouTubeTitle(sourceUrl) {
        try {
            const endpoint = new URL('https://www.youtube.com/oembed');
            endpoint.searchParams.set('url', sourceUrl);
            endpoint.searchParams.set('format', 'json');

            const response = await fetch(endpoint);
            if (!response.ok) return 'YouTube video';

            const payload = await response.json();
            return payload.title || 'YouTube video';
        } catch {
            return 'YouTube video';
        }
    }

    extractYouTubeId(url) {
        if (url.hostname.replace(/^www\./, '') === 'youtu.be') {
            return url.pathname.replace('/', '') || null;
        }

        if (url.searchParams.get('v')) {
            return url.searchParams.get('v');
        }

        const embedMatch = url.pathname.match(/\/embed\/([^/]+)/);
        return embedMatch?.[1] || null;
    }

    extractGoogleDriveId(url) {
        const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
        if (fileMatch?.[1]) return fileMatch[1];

        return url.searchParams.get('id');
    }
}

export default PublicTranscriptService;
