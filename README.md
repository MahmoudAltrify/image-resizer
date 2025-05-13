# 📄 Image Resizing via AWS Lambda & ImageMagick

## 🎯 Objective

Automatically resize images uploaded to an S3 bucket into multiple sizes (e.g., thumbnail, medium, large) using AWS Lambda and ImageMagick.

## 🛠️ Prerequisites

- Install AWS CLI: [AWS CLI Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- Install Docker: [Docker Installation](https://docs.docker.com/get-docker/)
- Install Node.js (v18+)
- Install LocalStack: `pip install localstack`
- Install AWS SDK and dependencies:
  ```bash
  npm install
  ```

- Ensure `aws` and `localstack` commands are available in your terminal

---

## 🧱 Architecture Overview

```
[S3 Bucket: my-bucket]
         |
         |-- uploads/original.jpg
         |
         v
[ S3 Event Notification ]
         |
         v
[ Lambda Function: ResizeImage ]
         |
         |-- [ImageMagick] Resize Logic
         |
         v
+-------------------------------+
|  S3 Output Structure:         |
|  - uploads/original.jpg       |
|  - thumbnails/original.jpg    |
|  - medium/original.jpg        |
|  - large/original.jpg         |
+-------------------------------+
```

---

## ⚙️ Setup Instructions

### 1. Clone & Prepare

```bash
git clone https://github.com/your-repo/image-resizer-lambda.git
cd image-resizer-lambda
```

### 2. Start Docker & LocalStack

```bash
docker compose up -d
```

### 3. Create Buckets in LocalStack

```bash
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test aws --endpoint-url=http://localhost:4566 s3 mb s3://local-bucket-source
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test aws --endpoint-url=http://localhost:4566 s3 mb s3://local-bucket-resized
```

### 4. Upload a Sample Image

If you don't already have a test image, download one (e.g., from a public S3 URL):

```bash
curl -o test.png https://numeroimages.s3.us-east-1.amazonaws.com/full-esim/flags/6808ced12c284.png
```

Alternatively, you can drag and drop your own image (e.g., `test.png`) into the project root directory. Make sure the image file is under 5MB to avoid hitting Lambda's `/tmp` storage limit.

Then upload to the source bucket in LocalStack:

```bash
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test \
aws --endpoint-url=http://localhost:4566 s3 cp test.png s3://local-bucket-source/test.png
```

### 5. Run Lambda Manually (simulate trigger)

```bash
docker compose exec image-resizer node src/handler.localTest.js
```

### 6. Verify Output

```bash
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test aws --endpoint-url=http://localhost:4566 s3 ls s3://local-bucket-resized/small/
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test aws --endpoint-url=http://localhost:4566 s3 ls s3://local-bucket-resized/medium/
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test aws --endpoint-url=http://localhost:4566 s3 ls s3://local-bucket-resized/large/
```

### 7. Cleanup (optional)

```bash
docker compose down -v
```

---

## ✅ Output Example

```
✅ Uploaded resized image: small/test.png
✅ Uploaded resized image: medium/test.png
✅ Uploaded resized image: large/test.png
```

---

## 📌 Best Practices

* Use `/tmp` for processing within Lambda (512MB limit)
* Prefer container image for advanced dependencies
* Validate MIME type and size before resizing
* Set retry policies or use DLQs for Lambda failures
* Sorry to not do them
