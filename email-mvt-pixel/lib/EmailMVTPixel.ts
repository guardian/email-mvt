import cdk = require('@aws-cdk/core');
import {Construct, Duration} from '@aws-cdk/core';
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
    const bucketForCFLogs = Helper.createS3Bucket(this,'Logs', pixelDomain, [''], [Helper.twoWeekLifecycleRule],true);

    const hostedZone = Helper.createNewHostedZone(this, props.hostedZoneId.valueAsString, props.tld.valueAsString);
    Helper.createCFDistribution(this, bucketForPixel, bucketForCFLogs, hostedZone, pixelDomain, props.certificateArn.valueAsString, originAccessIdentity);

    // new cdk.CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });
    // new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
  }
}
