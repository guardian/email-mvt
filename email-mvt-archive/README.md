A Lambda function to archive the CloudFront logs into daily partitions
----------------------------------------------------------------------
This is repo containing a Lambda function which executes daily and copies the logs into another S3 bucket in folders representing daily batches, to enable a partitioned Athena table to be placed over-the-top.

## Instructions to build and run:
 - Setup steps (in this folder):
   1. `brew install nvm`
   2. `nvm install`
   3. `pnpm install`
   4. `pnpm lint`
   5. `pnpm build`

