A Lambda function to archive the CloudFront logs into daily partitions
----------------------------------------------------------------------
This is repo containing a Lambda function which executes daily and copies the logs into another S3 bucket in folders representing daily batches, to enable a partitioned Athena table to be placed over-the-top.

## Instructions to build and run:
 - Setup steps (in this folder):
    1. `brew install node`
    2. `brew install npm`
    3. `npm install`
    
 - When you are ready to generate a new `template.yaml` file for uploading:
    1. `npm run build`
    2. `npm run cdk`
    
