import { S3Client } from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION ?? 'us-east-1';

export const s3 = new S3Client({
    region,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    },
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET ?? '';

export function buildS3Key(userId: string, fileId: string, filename: string) {
    const ext = filename.includes('.')
        ? filename.slice(filename.lastIndexOf('.'))
        : '';
    return `uploads/${userId}/${fileId}${ext}`;
}

export function buildPublicUrl(s3Key: string) {
    return `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${s3Key}`;
}
