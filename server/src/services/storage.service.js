/**
 * Storage Service
 * Purpose: Store uploaded video files locally or in Google Cloud Storage.
 * SRS Reference: NFR-S02, uploaded video portal storage
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import config from '../config/config.js';
import appError from '../utils/appError.js';

class LocalStorageProvider {
    constructor() {
        this.provider = 'local';
        this.uploadDirectory = path.resolve(
            path.dirname(fileURLToPath(import.meta.url)),
            '../../uploads/videos'
        );
    }

    async upload({ fileBuffer, fileName }) {
        const storagePath = path.join(this.uploadDirectory, fileName);

        await fs.mkdir(this.uploadDirectory, { recursive: true });
        await fs.writeFile(storagePath, fileBuffer);

        return {
            storageProvider: this.provider,
            storageKey: fileName,
            storagePath,
            storageUrl: storagePath,
            publicUrl: null,
        };
    }

    async deleteObject({ storagePath }) {
        if (!storagePath) return;
        await fs.unlink(storagePath).catch(() => null);
    }

    async getReadUrl({ storagePath }) {
        if (!storagePath) {
            throw appError('Stored video file is not available', 404);
        }

        return {
            url: storagePath,
            expiresAt: null,
            storageProvider: this.provider,
        };
    }
}

class GoogleCloudStorageProvider {
    constructor() {
        this.provider = 'google_cloud';
        this.bucketName = config.GCS_BUCKET_NAME;
        this.uploadPrefix = config.GCS_UPLOAD_PREFIX.replace(/^\/+|\/+$/g, '');
        this.publicBaseUrl = config.GCS_PUBLIC_BASE_URL?.replace(/\/+$/g, '');
    }

    async getClient() {
        if (!this.bucketName) {
            throw appError('GCS_BUCKET_NAME is required when STORAGE_PROVIDER=gcs', 500);
        }

        const { Storage } = await import('@google-cloud/storage');
        const options = {};

        if (config.GCS_PROJECT_ID) options.projectId = config.GCS_PROJECT_ID;
        if (config.GCS_KEY_FILE) options.keyFilename = config.GCS_KEY_FILE;
        if (config.GCS_CLIENT_EMAIL && config.GCS_PRIVATE_KEY) {
            options.credentials = {
                client_email: config.GCS_CLIENT_EMAIL,
                private_key: config.GCS_PRIVATE_KEY,
            };
        }

        return new Storage(options);
    }

    async upload({ fileBuffer, fileName, mimeType }) {
        const client = await this.getClient();
        const storageKey = `${this.uploadPrefix}/${fileName}`;
        const file = client.bucket(this.bucketName).file(storageKey);

        await file.save(fileBuffer, {
            contentType: mimeType || 'application/octet-stream',
            metadata: {
                cacheControl: 'private, max-age=0, no-transform',
            },
            resumable: false,
            validation: 'crc32c',
        });

        return {
            storageProvider: this.provider,
            storageKey,
            storagePath: `gs://${this.bucketName}/${storageKey}`,
            storageUrl: `gs://${this.bucketName}/${storageKey}`,
            publicUrl: this.publicBaseUrl ? `${this.publicBaseUrl}/${storageKey}` : null,
        };
    }

    async deleteObject({ storageKey }) {
        if (!storageKey) return;

        const client = await this.getClient();
        await client.bucket(this.bucketName).file(storageKey).delete({ ignoreNotFound: true });
    }

    async getReadUrl({ storageKey, publicUrl }) {
        if (publicUrl) {
            return {
                url: publicUrl,
                expiresAt: null,
                storageProvider: this.provider,
            };
        }

        if (!storageKey) {
            throw appError('GCS storage key is not available for this video', 404);
        }

        const client = await this.getClient();
        const expiresAt = Date.now() + config.GCS_SIGNED_URL_TTL_SECONDS * 1000;
        const [url] = await client.bucket(this.bucketName).file(storageKey).getSignedUrl({
            action: 'read',
            expires: expiresAt,
            version: 'v4',
        });

        return {
            url,
            expiresAt: new Date(expiresAt).toISOString(),
            storageProvider: this.provider,
        };
    }
}

export const createStorageProvider = (providerName = config.STORAGE_PROVIDER) => {
    if (['gcs', 'google_cloud', 'google-cloud'].includes(providerName)) {
        return new GoogleCloudStorageProvider();
    }

    return new LocalStorageProvider();
};

export default createStorageProvider;
