import { S3 } from '@aws-sdk/client-s3';
import type { CopyObjectCommandOutput, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';

const s3 = new S3();
const filenameDateRegex = /(\d\d\d\d-\d\d-\d\d)-\d\d/;

type S3Object = NonNullable<ListObjectsV2CommandOutput['Contents']>[number];

async function listAllObjects(s3Objects: S3Object[], Bucket: string, ContinuationToken?: string){
  const { Contents, IsTruncated, NextContinuationToken } = await s3.listObjectsV2({ Bucket, ContinuationToken });
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

function getTransferableFiles(allS3Objects: S3Object[]) {
  const [dateToday] = new Date().toISOString().split('T');
  return allS3Objects
    .filter(s3object => s3object.Key && filenameDateRegex.test(s3object.Key))
    .map(s3object => {
      if (s3object.Key) {
        const s3objectValue = `${s3object.Key}`;
        const matches = s3objectValue.match(filenameDateRegex);
        if (matches && matches.length > 0 && matches[1]) {
          const dateFromFilename = matches[1];
          if (dateFromFilename < dateToday) { // Only copy over data before today
            const tuple: TransferableFile = {sourceFileName: s3objectValue, destinationFolder: dateFromFilename};
            return tuple;
          }
        }
      }
    }).filter((item): item is TransferableFile => !!item);
}

function processTransfer(
    transferableFiles: TransferableFile[],
    sourceS3Bucket: string,
    destinationS3Bucket: string): Array<Promise<string | false | CopyObjectCommandOutput>> {
  return transferableFiles.map(fileToTransfer => {
    return s3.headObject({
      Bucket: destinationS3Bucket,
      Key: `dt=${fileToTransfer.destinationFolder}/${fileToTransfer.sourceFileName}`
    })
      .then(() => Promise.resolve('skipped'))
      .catch(() => s3.copyObject({
        Bucket: destinationS3Bucket,
        CopySource: `${sourceS3Bucket}/${fileToTransfer.sourceFileName}`,
        Key: `dt=${fileToTransfer.destinationFolder}/${fileToTransfer.sourceFileName}`
      }))
      .catch(() => false);
  });
}

export async function handler() {

  const sourceS3Bucket = process.env.source_s3_bucket;
  const destinationS3Bucket = process.env.destination_s3_bucket;

  if (!(sourceS3Bucket && destinationS3Bucket && sourceS3Bucket !== destinationS3Bucket)) return 'Invalid Environment';

  const allS3Objects: S3Object[] = [];

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
