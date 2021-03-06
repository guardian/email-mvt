import iam = require('@aws-cdk/aws-iam');
import route53 = require('@aws-cdk/aws-route53');
import targets = require('@aws-cdk/aws-route53-targets/lib');
import cloudfront = require('@aws-cdk/aws-cloudfront');
import s3 = require('@aws-cdk/aws-s3');
import {Construct, Duration} from '@aws-cdk/core';

export module Helper {

  export const GNMRetenionPeriodLifecycleRule: s3.LifecycleRule = {
    enabled: true,
    expiration: Duration.days(912), // 30 months
    abortIncompleteMultipartUploadAfter: Duration.days(2)
  };

  export const fourWeekLifecycleRule: s3.LifecycleRule = {
    enabled: true,
    expiration: Duration.days(28),
    abortIncompleteMultipartUploadAfter: Duration.days(2)
  };

  export function createNewOriginAccessIdentity(construct: Construct, domain: string): cloudfront.OriginAccessIdentity {
    return new cloudfront.OriginAccessIdentity(construct, `OriginAccessIdentity`, {
        comment: `Access Identity for ${domain}`
    });
  }

  export function createNewHostedZone(construct: Construct, zoneId: string, zoneName: string): route53.IHostedZone {
    return route53.HostedZone.fromHostedZoneAttributes(construct, 'HostedZone', {
      hostedZoneId: zoneId,
      zoneName: zoneName
    });
  }

  export function createS3Bucket(construct: Construct, idPrefix: string,
    bucketNameSuffix: string,
    policyActions: string[],
    lifecycleRules: s3.LifecycleRule[],
    encrypted: boolean,
    versioned: boolean,
    originAccessIdentity?: cloudfront.OriginAccessIdentity): s3.Bucket {
    const bucket = new s3.Bucket(construct, `${idPrefix}S3Bucket`, {
      bucketName: `${idPrefix.toLowerCase()}-${bucketNameSuffix}`,
      encryption: encrypted ? s3.BucketEncryption.S3_MANAGED : s3.BucketEncryption.UNENCRYPTED,
      lifecycleRules: lifecycleRules,
      versioned: versioned,
    });
    if (originAccessIdentity) {
      const pixelBucketPolicy = new iam.PolicyStatement({
        actions: policyActions,
        resources: [`${bucket.bucketArn}/*`],
        principals: [
          originAccessIdentity.grantPrincipal
        ]
      });
      bucket.addToResourcePolicy(pixelBucketPolicy);
    }
    return bucket;
  }

  export function createCFDistribution(construct: Construct, s3BucketSource: s3.Bucket, s3BucketForCFLogs: s3.Bucket, hostedZone: route53.IHostedZone, domainName: string, certificateArn: string, originAccessIdentity: cloudfront.OriginAccessIdentity): cloudfront.CloudFrontWebDistribution {
    const distribution = new cloudfront.CloudFrontWebDistribution(construct,  `CloudFrontDistribution`, {
      aliasConfiguration: {
        acmCertRef: certificateArn,
        names: [domainName],
      },
      originConfigs: [{
        s3OriginSource: {
          s3BucketSource: s3BucketSource,
          originAccessIdentity: originAccessIdentity
        },
        behaviors: [{ isDefaultBehavior: true }],
      }],
      loggingConfig: {
        bucket: s3BucketForCFLogs
      }
    });
    new route53.AaaaRecord(construct, `Route53AAARecordAlias`, {
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone: hostedZone
    });
    new route53.ARecord(construct, `Route53ARecord`, {
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone: hostedZone
    });
    return distribution;
  }
}

export enum StackStage {
  Code = 'CODE',
  Prod = 'PROD',
}