import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../env.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

const s3Client = new S3Client({
    region: env.S3_REGION || 'us-east-1',
    credentials: {
        accessKeyId: env.S3_ACCESS_KEY || '',
        secretAccessKey: env.S3_SECRET_KEY || ''
    },
    // If using Cloudflare R2, Minio or DigitalOcean Spaces
    endpoint: env.S3_ENDPOINT || undefined,
    forcePathStyle: true,
});

const BUCKET_NAME = env.S3_BUCKET || 'default-bucket';

export const uploadFile = async (buffer: Buffer, originalName: string, mimeType: string, folder = 'uploads') => {
    const defaultExt = originalName.split('.').pop() || 'bin';
    const key = `${folder}/${uuidv4()}.${defaultExt}`;

    try {
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        });

        await s3Client.send(command);
        logger.info(`File uploaded successfully to S3: ${key}`);

        return {
            key,
            url: env.S3_PUBLIC_URL ? `${env.S3_PUBLIC_URL}/${key}` : `https://${BUCKET_NAME}.s3.${env.S3_REGION}.amazonaws.com/${key}`
        };
    } catch (error) {
        logger.error(error, 'Error uploading file to S3:');
        throw error;
    }
};

export const getSecureUrl = async (key: string, expiresIn = 3600) => {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });
        return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
        logger.error(error, 'Error generating pre-signed URL:');
        throw error;
    }
};

export const deleteFile = async (key: string) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });
        await s3Client.send(command);
        logger.info(`File deleted from S3: ${key}`);
        return true;
    } catch (error) {
        logger.error(error, 'Error deleting file from S3:');
        throw error;
    }
};
