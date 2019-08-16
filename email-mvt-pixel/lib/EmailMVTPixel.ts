import cdk = require('@aws-cdk/core');
import cloudfront = require('@aws-cdk/aws-cloudfront');
import s3 = require('@aws-cdk/aws-s3');
import {Construct, Duration} from '@aws-cdk/core';
import iam = require('@aws-cdk/aws-iam');
import route53 = require('@aws-cdk/aws-route53');
import targets = require('@aws-cdk/aws-route53-targets/lib');

export interface EmailPixelProps {
  certificateArn: cdk.CfnParameter;
  hostedZoneId: cdk.CfnParameter;
  tld: cdk.CfnParameter;
  stageSubdomain: cdk.CfnParameter;
}

export class EmailMVTPixel extends Construct {

  twoWeekLifecycleRule: s3.LifecycleRule = {
    enabled: true,
    expiration: Duration.days(14),
    abortIncompleteMultipartUploadAfter: Duration.days(2)
  };

  createNewOriginAccessIdentity(domain: string): cloudfront.CfnCloudFrontOriginAccessIdentity {
    return new cloudfront.CfnCloudFrontOriginAccessIdentity(this, `OriginAccessIdentity`, {
      cloudFrontOriginAccessIdentityConfig: {
        comment: `Access Identity for ${domain}`
      }
    });
  }

  createNewHostedZone(zoneId: string, zoneName: string): route53.IHostedZone {
    return route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: zoneId,
      zoneName: zoneName
    });
  }

  createS3Bucket(idPrefix: string,
                 bucketNameSuffix: string,
                 policyActions: string[],
                 lifecycleRules: s3.LifecycleRule[],
                 encrypted: boolean,
                 originAccessIdentity?: cloudfront.CfnCloudFrontOriginAccessIdentity): s3.Bucket {
    const bucket = new s3.Bucket(this, `${idPrefix}S3Bucket`, {
      bucketName: `${idPrefix.toLowerCase()}-${bucketNameSuffix}`,
      encryption: encrypted ? s3.BucketEncryption.S3_MANAGED : s3.BucketEncryption.UNENCRYPTED,
      lifecycleRules: lifecycleRules
    });
    if (originAccessIdentity) {
      const pixelBucketPolicy = new iam.PolicyStatement({
        actions: policyActions,
        resources: [`${bucket.bucketArn}/*`],
        principals: [
          new iam.CanonicalUserPrincipal(originAccessIdentity.attrS3CanonicalUserId)
        ]
      });
      bucket.addToResourcePolicy(pixelBucketPolicy);
    }
    return bucket;
  }

  createCFDistribution(s3BucketSource: s3.Bucket, s3BucketForCFLogs: s3.Bucket, hostedZone: route53.IHostedZone, domainName: string, certificateArn: string, originAccessIdentity: cloudfront.CfnCloudFrontOriginAccessIdentity): cloudfront.CloudFrontWebDistribution {
    const distribution = new cloudfront.CloudFrontWebDistribution(this,  `CloudFrontDistribution`, {
      aliasConfiguration: {
        acmCertRef: certificateArn,
        names: [domainName],
      },
      originConfigs: [{
        s3OriginSource: {
          s3BucketSource: s3BucketSource,
          originAccessIdentityId: originAccessIdentity.ref
        },
        behaviors: [{ isDefaultBehavior: true }],
      }],
      loggingConfig: {
        bucket: s3BucketForCFLogs
      }
    });
    new route53.AaaaRecord(this, `Route53AAARecordAlias`, {
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone: hostedZone
    });
    new route53.ARecord(this, `Route53ARecord`, {
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone: hostedZone
    });
    return distribution;
  }

  constructor(parent: Construct, name: string, props: EmailPixelProps) {
    super(parent, name);

    const pixelDomain = `email-${props.stageSubdomain.valueAsString}.${props.tld.valueAsString}`;
    const originAccessIdentity = this.createNewOriginAccessIdentity(pixelDomain);
    const bucketForPixel = this.createS3Bucket('Source', pixelDomain, ['s3:GetObject'], [], false, originAccessIdentity);
    const bucketForCFLogs = this.createS3Bucket('Logs', pixelDomain, [''], [this.twoWeekLifecycleRule],true);

    const hostedZone = this.createNewHostedZone(props.hostedZoneId.valueAsString, props.tld.valueAsString);
    this.createCFDistribution(bucketForPixel, bucketForCFLogs, hostedZone, pixelDomain, props.certificateArn.valueAsString, originAccessIdentity);

    // new cdk.CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });
    // new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
  }
}
