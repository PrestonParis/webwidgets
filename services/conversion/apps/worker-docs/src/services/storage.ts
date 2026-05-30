import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import {
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { env } from '../env.js';

const s3 = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: 'us-east-1',
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
});

export async function downloadObject(
    objectKey: string,
    destinationPath: string,
) {
    const response = await s3.send(
        new GetObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: objectKey,
        }),
    );

    if (!response.Body) throw new Error(`Object ${objectKey} had no body.`);
    await pipeline(
        response.Body as NodeJS.ReadableStream,
        createWriteStream(destinationPath),
    );
}

export async function uploadObject(
    objectKey: string,
    sourcePath: string,
    contentType: string,
) {
    await s3.send(
        new PutObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: objectKey,
            Body: createReadStream(sourcePath),
            ContentType: contentType,
        }),
    );
}
