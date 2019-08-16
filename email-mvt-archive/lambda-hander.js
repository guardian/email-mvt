const aws = require('aws-sdk');
const s3 = new aws.S3();
exports.handler = async () => {
  const listResponse = await s3.listObjectsV2({ Bucket: process.env.source_s3_bucket }).promise();
  const relevantObjects = listResponse.Contents.filter(obj => !/\//.test(obj.Key));
  const objectsWithDesiredFolder = relevantObjects.map(s3object => {
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
