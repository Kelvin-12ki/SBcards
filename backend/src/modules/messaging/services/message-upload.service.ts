import {
  Injectable,
  Logger,
  BadRequestException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { randomUUID, randomBytes } from 'crypto';

/** Image types accepted for a chat attachment. */
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class MessageUploadService {
  private readonly logger = new Logger(MessageUploadService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * The Admin SDK is initialised without a default bucket, so the name is
   * resolved here instead. Newer Firebase projects (this one included) use the
   * .firebasestorage.app domain rather than the legacy .appspot.com.
   */
  private resolveBucketName(): string {
    const explicit = this.configService.get<string>('FIREBASE_STORAGE_BUCKET');
    if (explicit) return explicit;

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    if (!projectId) {
      throw new ServiceUnavailableException(
        'Image upload is not configured: set FIREBASE_STORAGE_BUCKET',
      );
    }

    return `${projectId}.firebasestorage.app`;
  }

  /**
   * Store a chat image and return a stable download URL.
   *
   * The URL carries a Firebase download token rather than making the object
   * public, so the link is unguessable and can be revoked by clearing the
   * token — matching what the client SDK produces for other uploads.
   */
  async uploadImage(
    conversationId: string,
    file: {
      buffer?: Buffer;
      mimetype?: string;
      size?: number;
      originalname?: string;
    },
  ): Promise<{ url: string; path: string; contentType: string; size: number }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file was uploaded');
    }

    const mimetype = (file.mimetype ?? '').toLowerCase();
    const extension = ALLOWED_MIME_TYPES[mimetype];

    if (!extension) {
      throw new BadRequestException(
        `Unsupported image type. Allowed: ${Object.keys(ALLOWED_MIME_TYPES).join(', ')}`,
      );
    }

    // Multer's own limit rejects oversized uploads first; this re-checks in
    // case the interceptor is ever reconfigured or bypassed.
    const size = file.size ?? file.buffer.length;
    if (size > MAX_FILE_SIZE) {
      throw new PayloadTooLargeException('Image must be 10MB or smaller');
    }

    if (!admin.apps.length) {
      throw new ServiceUnavailableException(
        'Image upload is unavailable: Firebase Admin is not initialised',
      );
    }

    const bucketName = this.resolveBucketName();
    const objectPath = `messages/${conversationId}/${Date.now()}-${randomBytes(8).toString('hex')}.${extension}`;
    const downloadToken = randomUUID();

    try {
      const bucket = admin.storage().bucket(bucketName);

      await bucket.file(objectPath).save(file.buffer, {
        contentType: mimetype,
        resumable: false,
        metadata: {
          contentType: mimetype,
          metadata: { firebaseStorageDownloadTokens: downloadToken },
        },
      });

      const url =
        `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/` +
        `${encodeURIComponent(objectPath)}?alt=media&token=${downloadToken}`;

      this.logger.log(`Uploaded chat image ${objectPath} (${size} bytes)`);

      return { url, path: objectPath, contentType: mimetype, size };
    } catch (err) {
      this.logger.error(
        `Chat image upload failed for conversation ${conversationId}: ${(err as Error).message}`,
      );
      throw new ServiceUnavailableException('Failed to store the image');
    }
  }

  static get maxFileSize(): number {
    return MAX_FILE_SIZE;
  }
}
