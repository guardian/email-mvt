A Lambda function to archive the CloudFront logs into daily partitions
----------------------------------------------------------------------
This is repo containing a Lambda function which executes daily and copies the logs into another S3 bucket in folders representing daily batches, to enable a partitioned Athena table to be placed over-the-top.
