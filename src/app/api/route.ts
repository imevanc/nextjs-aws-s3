import { NextRequest, NextResponse } from "next/server";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { S3Client } from "@aws-sdk/client-s3";
import { getErrorMessage } from "@/utils/getErrorMessage";

const sanitizeFilename = (value: string): string => value.replace(/[^a-zA-Z0-9._-]/g, "-");

const normalizeDomain = (domain: string): string => {
  if (!domain) return "";
  return domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
};

export async function GET(req: NextRequest) {
  const filename = req.nextUrl.searchParams.get("filename");
  const contentType = req.nextUrl.searchParams.get("contentType");

  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_BUCKET_NAME;

  if (!region || !bucket) {
    return NextResponse.json({ error: "AWS_REGION and AWS_BUCKET_NAME are required." }, { status: 500 });
  }

  if (!filename || !contentType) {
    return NextResponse.json({ error: "filename and contentType are required query params." }, { status: 400 });
  }

  try {
    const client = new S3Client({ region });

    const safeFilename = sanitizeFilename(filename);
    const key = `uploads/${Date.now()}-${safeFilename}`;

    const { url, fields } = await createPresignedPost(client, {
      Bucket: bucket,
      Key: key,
      Conditions: [["starts-with", "$Content-Type", contentType]],
      Fields: {
        acl: "public-read",
        "Content-Type": contentType,
      },
      Expires: 600,
    });

    const s3ObjectUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    const cloudFrontDomain = normalizeDomain(process.env.CLOUDFRONT_DOMAIN ?? "");
    const cdnObjectUrl = cloudFrontDomain ? `https://${cloudFrontDomain}/${key}` : null;

    return NextResponse.json({
      uploadUrl: url,
      fields,
      objectKey: key,
      s3ObjectUrl,
      cdnObjectUrl,
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
