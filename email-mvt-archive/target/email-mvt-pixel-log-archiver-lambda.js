"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws = require('aws-sdk');
const s3 = new aws.S3();
const filenameDateRegex = /(\d\d\d\d-\d\d-\d\d)-\d\d/;
async function listAllObjects(s3Objects, Bucket, ContinuationToken) {
    const { Contents, IsTruncated, NextContinuationToken } = await s3.listObjectsV2({ Bucket, ContinuationToken }).promise();
    s3Objects.push(...Contents);
    if (IsTruncated) {
        await listAllObjects(s3Objects, Bucket, NextContinuationToken); // RECURSIVE CALL
    }
}
function getTransferableFiles(allS3Objects) {
    return allS3Objects
        .filter(s3object => filenameDateRegex.test(`${s3object.Key}`))
        .map(s3object => {
        const s3objectValue = `${s3object.Key}`;
        const matches = s3objectValue.match(filenameDateRegex);
        if (matches && matches.length > 0) {
            const dateFromFilename = matches[1];
            const tuple = { sourceFileName: s3objectValue, destinationFolder: dateFromFilename };
            return tuple;
        }
    }).filter((item) => !!item);
}
function processTransfer(transferableFiles) {
    const sourceS3Bucket = process.env.source_s3_bucket;
    const destinationS3Bucket = process.env.destination_s3_bucket;
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
exports.handler = async () => {
    const sourceS3Bucket = process.env.source_s3_bucket;
    const destinationS3Bucket = process.env.destination_s3_bucket;
    if (!(sourceS3Bucket && destinationS3Bucket && sourceS3Bucket !== destinationS3Bucket))
        return 'Invalid Environment';
    const allS3Objects = [];
    await listAllObjects(allS3Objects, sourceS3Bucket);
    const promises = processTransfer(getTransferableFiles(allS3Objects));
    const results = await Promise.all(promises);
    const skippedResults = results.filter(value => value === 'skipped');
    const failedResults = results.filter(value => !value);
    const copiedResults = results.filter(value => value && value !== 'skipped');
    const log = `Files: ${copiedResults.length} copied. ${skippedResults.length} skipped. ${failedResults.length} failed.`;
    console.log(log);
    return log;
};
