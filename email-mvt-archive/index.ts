#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import {EmailMVTLogArchiver} from './lib/EmailMVTLogArchiver';
import {StackStage} from "../shared-ts/helpers";
import {Fn} from "@aws-cdk/core";

const app = new cdk.App({ context: { 'App': 'EmailMVTLogArchiver', 'Stack': 'targeting' }});

class EmailMVTLogArchiverStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stage = new cdk.CfnParameter(this, 'Stage', {
      type: 'String',
      default: StackStage.Code,
      allowedValues: [StackStage.Code, StackStage.Prod],
    });

    const defaultBucketName = new cdk.CfnParameter(this, 'DestinationBucket', {
      type: 'String',
      description: `S3 bucket to copy logs into. Make sure the Lambda has write access into the bucket and that it's encrypted, has versioning disabled, and has a 28 day retention policy.`
    });

    const sourceBucketName = Fn.importValue(`EmailMVTPixel-Logs-S3Bucket-${stage.valueAsString}`);

    // The code that defines your stack goes here
    new EmailMVTLogArchiver(this, this.node.tryGetContext('App'), { stage: stage.valueAsString, sourceBucketName, defaultBucketName: defaultBucketName.valueAsString });
  }
}

new EmailMVTLogArchiverStack(app, 'EmailMVTLogArchiverStack');
