const aws = require('aws-sdk');
const s3 = new aws.S3();
const filenameDateRegex = /(\d\d\d\d-\d\d-\d\d)-\d\d/;

async function listAllObjects(s3Objects, Bucket, ContinuationToken){
  const { Contents, IsTruncated, NextContinuationToken } = await s3.listObjectsV2({ Bucket, ContinuationToken }).promise();
  s3Objects.push(...Contents);
  if (IsTruncated) {
    await listAllObjects(s3Objects, Bucket, NextContinuationToken); // RECURSIVE CALL
  }
}

exports.handler = async () => {
  const allObjects = [];
  await listAllObjects(allObjects, process.env.source_s3_bucket);
  const objectsWithDesiredFolder = allObjects
    .filter(s3object => filenameDateRegex.test(s3object.Key))
    .map(s3object => {
      const dateFromFilename = s3object.Key.match(filenameDateRegex)[1];
      return [s3object.Key, dateFromFilename];
    });
  const promises = objectsWithDesiredFolder.map(tuple => {
    const [source, destinationFolder] = tuple;
    return s3.headObject({
      Bucket: `${process.env.destination_s3_bucket}/dt=${destinationFolder}`,
      Key: source
    }).promise()
      .then(() => Promise.resolve('skipped'))
      .catch(() => s3.copyObject({
        ACL: 'bucket-owner-read',
        Bucket: `${process.env.destination_s3_bucket}/dt=${destinationFolder}`,
        CopySource: `${process.env.source_s3_bucket}/${source}`,
        Key: source
      }).promise());
  });
  const results = await Promise.all(promises);
  const copiedResults = results.filter(value => value !== 'skipped');
  const skippedResults = results.filter(value => value === 'skipped')
  const log = `Copied ${copiedResults.length} objects. Skipped ${skippedResults.length} objects.`
  console.log(log);
  return log;
};
