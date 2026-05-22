import { S3Client } from '@aws-sdk/client-s3';

const region =
    process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1';
const accessKeyId =
    process.env.AWS_ACCESS_KEY_ID?.trim() ||
    process.env.AWS_ACCESS_KEY?.trim() ||
    '';
const secretAccessKey =
    process.env.AWS_SECRET_ACCESS_KEY?.trim() ||
    process.env.AWS_SECRET_KEY?.trim() ||
    '';
const sessionToken = process.env.AWS_SESSION_TOKEN?.trim() || undefined;

export const s3 = new S3Client({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken ? { sessionToken } : {}),
    },
});

export const S3_BUCKET =
    process.env.AWS_S3_BUCKET?.trim() ||
    process.env.S3_BUCKET?.trim() ||
    process.env.AWS_BUCKET_NAME?.trim() ||
    '';

export function hasS3Config() {
    return Boolean(accessKeyId && secretAccessKey && S3_BUCKET);
}

export function buildS3Key(userId: string, fileId: string, filename: string) {
    const ext = filename.includes('.')
        ? filename.slice(filename.lastIndexOf('.'))
        : '';
    return `uploads/${userId}/${fileId}${ext}`;
}

export function buildPublicUrl(s3Key: string) {
    return `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${s3Key}`;
}
