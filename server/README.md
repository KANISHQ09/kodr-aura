# VidAsk AI Backend

Express and MongoDB backend for the VidAsk AI video learning companion.

## Features

- Uploaded video library with a maximum of 10 stored videos.
- Transcript-based video summaries, topic breakdowns, last-five-minute recaps, and Q&A.
- Public-link analysis for YouTube captions and transcript-provided Google Drive or direct video links.
- No authentication routes or JWT middleware.
- Class-based model, contract, repository, service, controller, validator, and route layers.

## Environment

```bash
PORT=3000
DB_URL=mongodb://localhost:27017/vidask
FRONTEND_URL=http://localhost:5173
AI_PROVIDER=local
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
MAX_UPLOADED_VIDEOS=10
MAX_VIDEO_UPLOAD_MB=500
CACHE_PROVIDER=memory
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=vidask
VIDEO_RUNTIME_CACHE_TTL_SECONDS=1800
QUEUE_PROVIDER=none
BULLMQ_REDIS_URL=redis://localhost:6379
VIDEO_PROCESSING_QUEUE_NAME=video-processing
VIDEO_PROCESSING_JOB_ATTEMPTS=3
VIDEO_PROCESSING_JOB_BACKOFF_MS=5000
STORAGE_PROVIDER=local
GCS_BUCKET_NAME=
GCS_PROJECT_ID=
GCS_KEY_FILE=
GCS_CLIENT_EMAIL=
GCS_PRIVATE_KEY=
GCS_UPLOAD_PREFIX=vidask/videos
GCS_PUBLIC_BASE_URL=
GCS_SIGNED_URL_TTL_SECONDS=900
```

Set `AI_PROVIDER=openai` and `OPENAI_API_KEY` to use OpenAI for JSON-formatted summaries and answers. With `AI_PROVIDER=local`, the backend uses deterministic transcript retrieval and extractive summaries.

Set `CACHE_PROVIDER=redis` and `REDIS_URL` to use Redis as the hot runtime memory layer for summaries, transcript chunks, topic breakdowns, and active video assistant state. If Redis is not configured, the backend uses in-memory cache for local development. Full video files stay in local/GCS object storage; Redis stores fast runtime data around the video.

Set `QUEUE_PROVIDER=bullmq` and `BULLMQ_REDIS_URL` to enqueue slow uploaded-video processing tasks in BullMQ. Run `npm run worker:video` as a separate process for background jobs.

Set `STORAGE_PROVIDER=gcs` and configure `GCS_BUCKET_NAME` plus either `GCS_KEY_FILE` or `GCS_CLIENT_EMAIL`/`GCS_PRIVATE_KEY` to store uploaded videos in Google Cloud Storage. If `GCS_PUBLIC_BASE_URL` is not set, playback uses short-lived signed URLs.

## Uploaded Videos

Create a transcript-backed uploaded video:

```bash
POST /api/v1/videos
{
  "title": "Lecture 1",
  "transcriptText": "Full transcript text..."
}
```

Upload a raw video file:

```bash
POST /api/v1/videos/upload?title=Lecture%201&fileName=lecture.mp4
Content-Type: video/mp4
```

If no transcript is included and `QUEUE_PROVIDER=bullmq`, the upload is stored immediately and a `transcribe-uploaded-video` job is added to the `video-processing` queue. The API returns quickly with `status: "processing"`.

Attach or replace transcript after upload:

```bash
POST /api/v1/videos/:id/transcript
{
  "transcriptSegments": [
    { "start": 0, "end": 12, "text": "Welcome to the lecture..." }
  ]
}
```

Ask a question:

```bash
POST /api/v1/videos/:id/ask
{
  "question": "What is the main idea?"
}
```

Other uploaded video endpoints:

- `GET /api/v1/videos`
- `GET /api/v1/videos/:id`
- `GET /api/v1/videos/:id/playback-url`
- `GET /api/v1/videos/:id/summary`
- `GET /api/v1/videos/:id/last-five-minutes`
- `DELETE /api/v1/videos/:id`

## Embeddable Video Assistant API

These normalized endpoints are suitable for an embeddable widget or third-party website integration:

- `POST /api/transcribe`
- `POST /api/chunk-index`
- `POST /api/ask`
- `POST /api/ask/stream`
- `GET /api/summary?transcript_id=...&source_type=uploaded_video`
- `GET /api/playback-url?transcript_id=...&source_type=uploaded_video`
- `DELETE /api/session`

## Public Videos

Analyze a public link:

```bash
POST /api/v1/public-videos/analyze
{
  "sourceUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

For Google Drive and direct video links, provide transcript text or timestamped transcript segments until a transcription worker is connected:

```bash
POST /api/v1/public-videos/analyze
{
  "sourceUrl": "https://drive.google.com/file/d/FILE_ID/view",
  "title": "Private class recording",
  "transcriptText": "Full transcript text..."
}
```

Ask a question:

```bash
POST /api/v1/public-videos/:id/ask
{
  "question": "Which examples are discussed?"
}
```

Other public video endpoints:

- `GET /api/v1/public-videos`
- `GET /api/v1/public-videos/:id`
- `GET /api/v1/public-videos/:id/summary`
- `GET /api/v1/public-videos/:id/last-five-minutes`
- `DELETE /api/v1/public-videos/:id`

## Run

```bash
npm install
npm run dev
```

Run the background worker separately when BullMQ is enabled:

```bash
npm run worker:video
```
