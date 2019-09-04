const aws = require('aws-sdk');
const s3 = new aws.S3();

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
  const objectsWithDesiredFolder = allObjects.map(s3object => {
    const year = '' + s3object.LastModified.getFullYear();
    const month = '' + (s3object.LastModified.getMonth()+1);
    const day = '' + s3object.LastModified.getDate();
    return [s3object.Key].concat(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
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
