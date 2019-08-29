CREATE EXTERNAL TABLE IF NOT EXISTS email_mvt_cloudfront_logs_partitioned (
  `date` DATE,
  time STRING,
  location STRING,
  bytes BIGINT,
  request_ip STRING,
  method STRING,
  host STRING,
  uri STRING,
  status INT,
  referrer STRING,
  user_agent STRING,
  query_string STRING,
  cookie STRING,
  result_type STRING,
  request_id STRING,
  host_header STRING,
  request_protocol STRING,
  request_bytes BIGINT,
  time_taken FLOAT,
  xforwarded_for STRING,
  ssl_protocol STRING,
  ssl_cipher STRING,
  response_result_type STRING,
  http_version STRING,
  fle_status STRING,
  fle_encrypted_fields INT
)
PARTITIONED BY (dt string)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '\t'
LOCATION 's3://archive-logs-email.mvt.theguardian.com/'
TBLPROPERTIES ( 'skip.header.line.count'='2' );

MSCK REPAIR TABLE email_mvt_cloudfront_logs_partitioned;