import cdk = require('@aws-cdk/core');
import {Construct} from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');
import {Helper} from '../../shared-ts/helpers';

export interface EmailPixelProps {
  certificateArn: cdk.CfnParameter;
  hostedZoneId: cdk.CfnParameter;
  tld: cdk.CfnParameter;
  stageSubdomain: cdk.CfnParameter;
}

export class EmailMVTPixel extends Construct {

  constructor(parent: Construct, name: string, props: EmailPixelProps) {
    super(parent, name);

    const pixelDomain = `email-${props.stageSubdomain.valueAsString}.${props.tld.valueAsString}`;
    const originAccessIdentity = Helper.createNewOriginAccessIdentity(this, pixelDomain);
    const bucketForPixel = Helper.createS3Bucket(this,'Source', pixelDomain, ['s3:GetObject'], [], false, originAccessIdentity);
    const bucketForCFLogs: s3.Bucket = Helper.createS3Bucket(this,'Logs', pixelDomain, [''], [Helper.twoWeekLifecycleRule],true);

    const hostedZone = Helper.createNewHostedZone(this, props.hostedZoneId.valueAsString, props.tld.valueAsString);
    Helper.createCFDistribution(this, bucketForPixel, bucketForCFLogs, hostedZone, pixelDomain, props.certificateArn.valueAsString, originAccessIdentity);

    new cdk.CfnOutput(this, 'CFLogs_S3Bucket_Output', {
      value: bucketForCFLogs.bucketName,
      exportName: 'EmailMVTPixel-Logs-S3Bucket'
    });
    // new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
  }
}
