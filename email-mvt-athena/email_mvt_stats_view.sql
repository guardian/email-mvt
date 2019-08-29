CREATE OR REPLACE VIEW email_mvt_stats_view AS
WITH foo AS (
    SELECT date, transform(split(query_string, '&'), x -> split(x, '=')) as arr FROM temp.email_mvt_cloudfront_logs_partitioned WHERE query_string LIKE '%identity_id=%'
), bar AS (
    SELECT date, filter(foo.arr, x -> cardinality(x) = 2) as tuples FROM foo
), baz AS (
    SELECT date, map(transform(bar.tuples, x -> x[1]), transform(bar.tuples, x -> x[2])) as mp FROM bar
)
-- This user, opened the email from this send and saw variant X of a particular merchandising component in position Y, on this day
SELECT mp['identity_id'] as identity_id, mp['send_id'] as dispatch_id, mp['variant'] as variant, mp['position'] as position, date as opened_date FROM baz WHERE mp['identity_id'] != '';