import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { S3Client } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { query } = req;
  const { filename, contentType } = query;

  try {
    const client = new S3Client({ region: process.env.AWS_REGION });

    const { url, fields } = await createPresignedPost(client, {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: filename?.toString()!,
      Conditions: [
        // ["content-length-range", 0, 10485760], // up to 10 MB
        ["starts-with", "$Content-Type", contentType?.toString()!],
      ],
      Fields: {
        acl: "public-read",
        "Content-Type": contentType?.toString()!,
      },
      Expires: 600, // Seconds before the presigned post expires. 3600 by default.
    });
    console.log(url, fields);
    return res.json({ url, fields });
  } catch (error) {
    return res.json({ error: getErrorMessage(error) });
  }
};

export default handler;
