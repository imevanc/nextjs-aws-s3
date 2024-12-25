import {NextApiRequest, NextApiResponse} from "next";
import {createPresignedPost} from "@aws-sdk/s3-presigned-post";
import {S3Client} from "@aws-sdk/client-s3";
import {getErrorMessage} from "@/utils/getErrorMessage";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const {query} = req;
    const {filename, contentType} = query;

    try {
        const client = new S3Client({region: process.env.AWS_REGION});

        const {url, fields} = await createPresignedPost(client, {
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: filename ? filename.toString() : "",
            Conditions: [["starts-with", "$Content-Type", contentType ? contentType.toString() : ""]],
            Fields: {
                acl: "public-read",
                "Content-Type": contentType ? contentType.toString() : "",
            },
            Expires: 600,
        });

        return res.json({url, fields});
    } catch (error) {
        return res.json({error: getErrorMessage(error)});
    }
};

export default handler;