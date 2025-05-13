const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const http = require('http');
const url = require('url');

const s3 = new S3Client({
    region: 'us-east-1',
    endpoint: 'http://localstack:4566',
    forcePathStyle: true,
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
    }
});

const sizes = [
    { suffix: 'small', width: 200 },
    { suffix: 'medium', width: 500 },
    { suffix: 'large', width: 1000 }
];

exports.resizeImage = async (event) => {
    console.log('Lambda trigger received:', JSON.stringify(event, null, 2));
    const record = event.Records?.[0];
    if (!record) {
        console.error("No S3 record found in the event.");
        return;
    }

    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const filename = path.basename(key);
    const downloadPath = `/tmp/${filename}`;
    const resizedDir = '/tmp';

    // Download the image from S3
    const data = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const writeStream = fs.createWriteStream(downloadPath);
    await new Promise((resolve, reject) => {
        data.Body.pipe(writeStream).on('finish', resolve).on('error', reject);
    });

    // Resize and upload to DESTINATION_BUCKET
    for (const { suffix, width } of sizes) {
        const outputPath = path.join(resizedDir, `${suffix}-${filename}`);
        const cmd = `convert ${downloadPath} -resize ${width}x ${outputPath}`;
        try {
            execSync(cmd);
            const fileBuffer = fs.readFileSync(outputPath);
            await s3.send(new PutObjectCommand({
                Bucket: process.env.DESTINATION_BUCKET,
                Key: `${suffix}/${filename}`,
                Body: fileBuffer,
                ContentType: 'image/png'
            }));
            console.log(`Uploaded resized image: ${suffix}/${filename}`);
        } catch (err) {
            console.error(`Failed resizing/uploading ${suffix}:`, err.message);
        }
    }

    console.log('All resizing operations complete.');
};

exports.localTest = async () => {
    const imageUrl = 'https://numeroimages.s3.us-east-1.amazonaws.com/full-esim/flags/6808ced12c284.png';
    const parsedUrl = url.parse(imageUrl);
    const filename = path.basename(parsedUrl.pathname);
    const downloadPath = `/tmp/${filename}`;
    const resizedDir = path.join(__dirname, '../resized');

    if (!fs.existsSync(resizedDir)) fs.mkdirSync(resizedDir);

    console.log(`Downloading ${imageUrl} to ${downloadPath}...`);

    const file = fs.createWriteStream(downloadPath);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    await new Promise((resolve, reject) => {
        protocol.get(imageUrl, (response) => {
            if (response.statusCode !== 200) return reject(new Error(`Download failed: ${response.statusCode}`));
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', reject);
    });

    for (const { suffix, width } of sizes) {
        const output = path.join(resizedDir, `${suffix}-${filename}`);
        const cmd = `convert ${downloadPath} -resize ${width}x ${output}`;
        try {
            execSync(cmd);
            console.log(`Resized (${suffix}): ${output}`);
        } catch (err) {
            console.error(`Error resizing (${suffix}):`, err.message);
        }
    }

    console.log('🎉 Image resizing complete!');
};