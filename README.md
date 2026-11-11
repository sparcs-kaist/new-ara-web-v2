This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Attachment uploads

Attachments use authenticated JSON session creation, one raw `File` PUT directly
to S3 (without Ara credentials), then authenticated completion. Only the completed
Attachment ID is submitted with an article. Failed files expose manual retry and
removal; completion retries preserve a successful PUT. There is no automatic retry
or multipart/resume support. Existing attachment consumers keep the Axios response
shape (`response.data`).

The default per-file limit is 5 GiB. When the backend deployment lowers
`ATTACHMENT_UPLOAD_MAX_BYTES`, set `NEXT_PUBLIC_ATTACHMENT_UPLOAD_MAX_BYTES` to the
same byte count **at frontend build time**. The backend remains authoritative;
the session API rejects sizes exceeding its configured limit before transfer.

Before rollout, deploy backend commit `a3d1854` and run its migrations (including
`0074_attachment_upload`). S3 CORS must allow frontend origins, `PUT`, and all
headers returned by the session API (including `If-None-Match` and `x-amz-*`).
The backend role needs `s3:PutObject`, `s3:PutObjectAcl`, `s3:PutObjectTagging`,
`s3:GetObject`, `s3:DeleteObjectTagging`, and `s3:ListBucket` for missing-object
detection. Configure lifecycle expiration for `files/direct-uploads/` objects
tagged `ara-upload=pending` with retention longer than 24 hours (e.g. 7 days).
Verify a real upload larger than 100 MB, browser CORS, authentication/CSRF, and
article creation/editing in both web and WebView against the deployed environment.

Run focused mocked regression tests with `node --test tests/attachment-upload.test.cjs`.
The 150 MiB test supplies file-size metadata without allocating or transmitting a
large file. Tests cover upload/retry state and submission guards; live S3 transfer
and browser integration still require the deployment checks above.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
