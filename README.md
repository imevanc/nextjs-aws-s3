# Next.js with AWS S3

An example of a Next.js application allowing you to upload photos to an Amazon Web Services S3 storage bucket.

## Next.js steps

- Create a new Next.js project or fork this repo.

## AWS console steps

- Create a new [IAM User](https://aws.amazon.com/iam/):
  1.  Select "Attach existing policies directly"
  2.  Add `AmazonS3FullAccess`
- Create a new [S3 Bucket](https://console.aws.amazon.com/s3/)
  1.  In the Object Ownership tab, select "ACLs enabled" & "Bucket owner preffered"
  2.  In Block Public Access settings for this bucket, uncheck "Block all public access"
  3.  The bucket needs to be in the same region as your IAM user
- Save the access key and secret key for the IAM User.
  1.  This is used for programmatic access in the API Route.
- Install the [AWS CLI](https://aws.amazon.com/cli/):
  1.  Run `aws configure`
  2.  Enter your root AWS user access key and secret key, the bucket's region name
- Create an `.env`
  1.  Enter your access key and secret key from the IAM user
  2.  Add this file in your .gitingore dependencies
- Go to your bucket, and select the "Permissions" tab
  1.  Scroll down to find "Cross-origin resource sharing (CORS)" and click "Edit" on the right side
  2.  Paste the following code below
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

