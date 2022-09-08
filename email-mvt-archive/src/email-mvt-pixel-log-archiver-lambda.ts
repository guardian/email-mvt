import type {S3} from "aws-sdk";
import aws from "aws-sdk";
import type {ObjectList} from "aws-sdk/clients/s3";

const s3 = new aws.S3();
const filenameDateRegex = /(\d\d\d\d-\d\d-\d\d)-\d\d/;

async function listAllObjects(s3Objects: S3.ObjectList, Bucket: string, ContinuationToken?: string){
  const { Contents, IsTruncated, NextContinuationToken } = await s3.listObjectsV2({ Bucket, ContinuationToken }).promise();
  if (Contents) {
    s3Objects.push(...Contents);
  }
  if (IsTruncated) {
    await listAllObjects(s3Objects, Bucket, NextContinuationToken); // RECURSIVE CALL
  }
}

interface TransferableFile {
  sourceFileName: string;
  destinationFolder: string;
}

function getTransferableFiles(allS3Objects: ObjectList) {
  return allS3Objects
    .filter(s3object => s3object.Key && filenameDateRegex.test(s3object.Key))
    .map(s3object => {
      if (s3object.Key) {
        const s3objectValue = `${s3object.Key}`;
        const matches = s3objectValue.match(filenameDateRegex);
        if (matches && matches.length > 0 && matches[1]) {
          const dateFromFilename = matches[1];
          const tuple: TransferableFile = {sourceFileName: s3objectValue, destinationFolder: dateFromFilename};
          return tuple;
        }
      }
    }).filter((item): item is TransferableFile => !!item);
}

function processTransfer(
    transferableFiles: TransferableFile[],
    sourceS3Bucket: string,
    destinationS3Bucket: string): Array<Promise<string | S3.Types.CopyObjectOutput>> {
  return transferableFiles.map(fileToTransfer => {
    return s3.headObject({
      Bucket: `${destinationS3Bucket}/dt=${fileToTransfer.destinationFolder}`,
      Key: fileToTransfer.sourceFileName
    }).promise()
      .then(() => Promise.resolve('skipped'))
      .catch(() => s3.copyObject({
        ACL: 'bucket-owner-read',
        Bucket: `${destinationS3Bucket}/dt=${fileToTransfer.destinationFolder}`,
        CopySource: `${sourceS3Bucket}/${fileToTransfer.sourceFileName}`,
        Key: fileToTransfer.sourceFileName
      }).promise());
  });
}

export async function handler() {

  const sourceS3Bucket = process.env.source_s3_bucket;
  const destinationS3Bucket = process.env.destination_s3_bucket;

  if (!(sourceS3Bucket && destinationS3Bucket && sourceS3Bucket !== destinationS3Bucket)) return 'Invalid Environment';

  const allS3Objects: ObjectList = [];

  await listAllObjects(allS3Objects, sourceS3Bucket);

  const promises = processTransfer(getTransferableFiles(allS3Objects), sourceS3Bucket, destinationS3Bucket);
  const results = await Promise.all(promises);

  const failedResults = results.filter(value => value === false);
  const skippedResults = results.filter(value => value === 'skipped')
  const copiedResults = results.filter(value => value !== false && value !== 'skipped');
  const log = `Files: ${copiedResults.length} copied. ${skippedResults.length} skipped. ${failedResults.length} failed.`

  console.log(log);
  return log;
}
