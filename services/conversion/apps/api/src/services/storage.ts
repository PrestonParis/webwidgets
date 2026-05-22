import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../env.js';

const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: 'us-east-1',
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY
  }
});

export async function configureBucketCors(allowedOrigins: string[]): Promise<void> {
  await s3.send(
    new PutBucketCorsCommand({
      Bucket: env.S3_BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: allowedOrigins,
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedHeaders: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3600
          }
        ]
      }
    })
  );
}

export function buildInputObjectKey(jobId: string, originalFileName: string) {
  const safeName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `inputs/${jobId}/${safeName}`;
}

export async function createUploadUrl(inputObjectKey: string) {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: inputObjectKey
    }),
    { expiresIn: 15 * 60 }
  );
}

export async function createDownloadUrl(outputObjectKey: string) {
  const filename = outputObjectKey.split('/').pop() ?? 'converted';
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: outputObjectKey,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    }),
    { expiresIn: 15 * 60 }
  );
}

export async function deleteObjects(objectKeys: string[]): Promise<void> {
  if (objectKeys.length === 0) return;
  await s3.send(
    new DeleteObjectsCommand({
      Bucket: env.S3_BUCKET,
      Delete: {
        Objects: objectKeys.map((Key) => ({ Key })),
        Quiet: true
      }
    })
  );
}

// Deletes both the input upload and the output result for a completed/failed job.
// TODO: Wire into a periodic cleanup routine (e.g. a cron job or BullMQ scheduled job)
// that calls this for jobs older than the configured retention period.
export async function deleteJobObjects(
  inputObjectKey: string,
  outputObjectKey?: string
): Promise<void> {
  const keys = [inputObjectKey, ...(outputObjectKey ? [outputObjectKey] : [])];
  await deleteObjects(keys);
}
