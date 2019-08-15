Tracking multi-variant content components within emails
-------------------------------------------------------

This repo contains software which enables us to track which content variants people see within instrumented emails.

- `email-mvt-pixel` is a repo containing code which generates the CloudFormation to build the pixel.
- `email-mvt-archive` is a repo containing a Lambda function which executes daily and copies the logs into another S3 bucket in folders representing daily batches, to enable a partitioned Athena table to be placed over-the-top.
- `email-mvt-data-asset` is a repo containing the Athena tables and scripts to generate and increment clean tracking data within the Data Lake.