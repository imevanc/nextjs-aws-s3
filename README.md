# Next.js + AWS S3 + CloudFront CDN

This project uploads images to Amazon S3 with a pre-signed POST URL and serves them through Amazon CloudFront for lower global latency.

## What is included

- Next.js 15 (App Router)
- React 19
- S3 upload API route (`src/app/api/route.ts`)
- CloudFront delivery URL in API response (`cdnObjectUrl`)
- Built-in browser benchmark demo on the homepage to compare `S3 Direct` vs `CloudFront CDN`

## Architecture

1. User selects a file in the UI.
2. Frontend calls `/api?filename=...&contentType=...`.
3. API returns:
   - `uploadUrl` + `fields` (for S3 pre-signed POST)
   - `s3ObjectUrl` (direct S3 object URL)
   - `cdnObjectUrl` (CloudFront URL, if `CLOUDFRONT_DOMAIN` is configured)
4. Frontend uploads directly to S3.
5. Frontend previews the uploaded image from CloudFront and can run a latency demo.

## Prerequisites

- AWS account
- S3 bucket
- CloudFront distribution (origin = S3 bucket)
- Node.js 20+

## AWS setup

### 1) IAM user

Create an IAM user with least-privilege S3 permissions for your upload bucket.

### 2) S3 bucket

- Keep bucket in your preferred region.
- For this demo, objects are uploaded with `public-read` ACL.
- Add bucket CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### 3) CloudFront distribution

- Origin: your S3 bucket
- Viewer protocol policy: Redirect HTTP to HTTPS
- Allowed methods: `GET, HEAD, OPTIONS`
- Cache policy: managed cache policy (or custom with reasonable TTL)
- Enable compression
- Copy your distribution domain (example: `d111111abcdef8.cloudfront.net`)

## Environment variables

Copy `.env.example` to `.env.local` and update values.

```bash
cp .env.example .env.local
```

Required values:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_BUCKET_NAME`
- `CLOUDFRONT_DOMAIN` (without `https://`)

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## CDN demo you can showcase

The home page includes a **Run CDN demo** button.

### Demo script for presentation

1. Upload one image.
2. Show side-by-side previews:
   - CloudFront URL
   - Direct S3 URL
3. Click **Run CDN demo**.
4. The app performs 5 fetches against each source and prints sample timings + average.
5. Run it twice:
   - First run warms cache.
   - Second run usually shows stronger CloudFront advantage.

### Talking points

- CloudFront serves from edge locations closer to end users.
- Repeated requests benefit from edge cache hits.
- Direct S3 always goes to bucket region, increasing latency for distant users.

## API response example

```json
{
  "uploadUrl": "https://your-bucket.s3.eu-central-1.amazonaws.com",
  "fields": {
    "key": "uploads/1710000000000-photo.jpg",
    "acl": "public-read",
    "Content-Type": "image/jpeg"
  },
  "objectKey": "uploads/1710000000000-photo.jpg",
  "s3ObjectUrl": "https://your-bucket.s3.eu-central-1.amazonaws.com/uploads/1710000000000-photo.jpg",
  "cdnObjectUrl": "https://d111111abcdef8.cloudfront.net/uploads/1710000000000-photo.jpg"
}
```

## Notes

- The benchmark runs in the browser and reflects your current network location.
- For production, prefer private S3 + CloudFront Origin Access Control and signed URLs/cookies where needed.
- If you overwrite object keys, consider versioned keys or invalidations for freshness.
