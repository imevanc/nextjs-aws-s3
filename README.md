## 🎯 Update - December 2024 🎯

I have updated the project to use the latest versions of key technologies:

- **Next.js**: Upgraded to version 15 with the new App Router for enhanced routing capabilities.
- **React.js**: Upgraded to version 19 for improved performance and new hooks functionality.
- **Renovate**: Integrated Renovate to automate dependency updates and keep the project up to date with minimal manual
  effort.
- **Amazon CloudFront**: The integration is still pending. This will be implemented in an upcoming update to further
  reduce latency and improve content delivery across regions.

These updates aim to enhance the project's maintainability, scalability, and performance while staying aligned with
modern development standards.

## 🎯 Update - April 2023 🎯

I am currently working on an updated Next.js-AWS application that enables users to get, put, and delete data from an S3
storage bucket. Additionally, I have integrated Amazon CloudFront for caching data to reduce latency across different
regions. The performance test results, comparing before and after the CloudFront integration, will be documented in the
README.md of this new project.

# Next.js with AWS S3

An example of a Next.js application that allows you to upload photos to an Amazon Web Services S3 storage bucket.

## Dev.to Article

[Next.js + AWS S3 Upload](https://dev.to/imevanc/nextjs-aws-s3-upload-3njb)

<img src="https://user-images.githubusercontent.com/96417438/233210789-16e18fb3-9d31-4c17-8d09-8f3de2aa3133.png" width=500/>

## Next.js Steps

- Create a new Next.js project or fork this repository.

## AWS Console Steps

- Create a new [IAM User](https://aws.amazon.com/iam/):
    1. Select `Attach existing policies directly`.
    2. Add the `AmazonS3FullAccess` policy.
- Create a new [S3 Bucket](https://console.aws.amazon.com/s3/):
    1. In the **Object Ownership** tab, select `ACLs enabled & Bucket owner preferred`.
    2. In the **Block Public Access** settings for this bucket, uncheck `Block all public access`.
    3. Ensure the bucket is in the same region as your IAM user.
- Save the access key and secret key for the IAM User:
    1. These keys will be used for programmatic access in the API route.
- Install the [AWS CLI](https://aws.amazon.com/cli/):
    1. Run `aws configure`.
    2. Enter your root AWS user access key, secret key, and the bucket's region name.
- Create an `.env` file:
    1. Enter the access key and secret key from the IAM User.
    2. Add this file to your `.gitignore` to secure sensitive dependencies.
- Go to your bucket and select the **Permissions** tab:
    1. Scroll down to find **Cross-origin resource sharing (CORS)** and click `Edit` on the right side.
    2. Paste the following code:
  ```json
  [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": []
    }
  ] 
  ```

## Demo

https://user-images.githubusercontent.com/96417438/232252729-3ccc1841-f35d-41c0-a413-af9fa64e6da3.mp4
