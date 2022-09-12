Tracking multi-variant content components within emails
-------------------------------------------------------

This repo contains software which enables GNM to track which content variants Guardian account holders see within instrumented newsletter emails.

- `email-mvt-pixel` folder contains legacy AWS CDK code which generates the CloudFormation to build the pixel. This is due to be rebuilt in Q3 2022. It relies on code in the `shared-ts` folder which is now deprecated as it is no longer used by any other submodule. 
- `email-mvt-archive` contains code for a Lambda function which executes daily and copies the logs into another S3 bucket in folders representing daily batches. This enables a partitioned Athena table to be placed over-the-top, and is current consumed by Spark jobs in the Data Lake.
- `cdk` contains [gu-cdk](https://github.com/guardian/cdk) code which generates the CloudFormation `.json` files for the archiver Lambda above.
- `email-mvt-athena` folder contains code to generate an Athena table, and scripts to generate a materialised view of the pixel data in a tabular format. Both of these are for developer testing / validation, and are not consumed by any business unit.