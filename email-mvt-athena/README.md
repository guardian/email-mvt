An Athena processor of the archive of pixel tracking logs
---------------------------------------------------------
This is a repo containing the Athena tables and scripts to generate a materialised view of the pixel data in a tabular format.

`email_mvt_cloudfront_logs_partitioned.sql` creates a table of the day-partitioned CloudWatch logs sitting in the archive S3 bucket.
`email_mvt_stats_view.sql` creates a materialised view of the relevant query parameters in the logs. This can be used to QA the data - it is not the production processor. That sits in Spark code [here](https://github.com/guardian/ophan-data-lake).

Note, if you wish to create these tables on a per-environment level, then change the S3 bucket name and maybe use a different Glue metastore database.