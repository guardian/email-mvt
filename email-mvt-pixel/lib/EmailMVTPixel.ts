import cdk = require('@aws-cdk/core');
import {Construct} from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');
import {Helper} from '../../shared-ts/helpers';

export interface EmailPixelProps {
  certificateArn: string;
  hostedZoneId: string;
  tld: string;
  stageSubdomain: string;
}

export class EmailMVTPixel extends Construct {

  bucketForCFLogs: s3.Bucket;

  constructor(parent: Construct, name: string, props: EmailPixelProps) {
    super(parent, name);

    const pixelDomain = `${props.stageSubdomain}.${props.tld}`;
    const originAccessIdentity = Helper.createNewOriginAccessIdentity(this, pixelDomain);
    const bucketForPixel = Helper.createS3Bucket(this,'Source', pixelDomain, ['s3:GetObject'], [], false, true, originAccessIdentity);
    this.bucketForCFLogs = Helper.createS3Bucket(this,'Logs', pixelDomain, [''], [Helper.fourWeekLifecycleRule],true, false);

    const hostedZone = Helper.createNewHostedZone(this, props.hostedZoneId, props.tld);
    Helper.createCFDistribution(this, bucketForPixel, this.bucketForCFLogs, hostedZone, pixelDomain, props.certificateArn, originAccessIdentity);
  }
}
