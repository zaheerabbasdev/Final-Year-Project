const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

const s3 = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    // In ECS the task IAM role supplies credentials automatically.
    // For local dev, set AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY in .env.
});

const BUCKET = process.env.AWS_S3_BUCKET;
const REGION = process.env.AWS_REGION || 'ap-south-1';

const MIME_MAP = {
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.gif':  'image/gif',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
};

/**
 * Upload a file buffer to S3 and return the public HTTPS URL.
 *
 * @param {Buffer} buffer      File contents
 * @param {string} originalname  Original filename (used for extension)
 * @param {string} fieldname   Multer field name (used as key prefix, e.g. 'avatar')
 * @returns {Promise<string>}  Public S3 URL
 */
async function uploadToS3(buffer, originalname, fieldname) {
    if (!BUCKET) throw new Error('AWS_S3_BUCKET env var is not set');

    const ext = path.extname(originalname).toLowerCase() || '.jpg';
    const key = `uploads/${fieldname}-${Date.now()}${ext}`;
    const contentType = MIME_MAP[ext] || 'application/octet-stream';

    await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    }));

    return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

module.exports = { uploadToS3 };
