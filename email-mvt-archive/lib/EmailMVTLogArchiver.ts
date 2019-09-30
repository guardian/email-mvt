import {Construct, Duration} from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');
import lambda = require('@aws-cdk/aws-lambda');
import iam = require('@aws-cdk/aws-iam');
import events = require('@aws-cdk/aws-events');

import {Helper} from '../../shared-ts/helpers';
import {Runtime} from "@aws-cdk/aws-lambda";
import targets = require('@aws-cdk/aws-events-targets');
import * as fs from "fs";
import {RuleTargetInput} from "@aws-cdk/aws-events";

export interface EmailMVTLogArchiverProps {
  stage: string;
  sourceBucketName: string;
  destinationBucketName: string;
}

export class EmailMVTLogArchiver extends Construct {

  constructor(parent: Construct, name: string, props: EmailMVTLogArchiverProps) {
    super(parent, name);

    const lambdaToCopyFiles: lambda.Function = new lambda.Function(this, 'Archiver', {
      code: new lambda.InlineCode(fs.readFileSync('lambda-hander.js',{ encoding: 'utf-8' })),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_8_10,
      memorySize: 768,
      functionName: `EmailMVTLogArchiver-${props.stage}`,
      timeout: Duration.seconds(60),
      initialPolicy: [
        new iam.PolicyStatement({
          resources: ['arn:aws:logs:*:*:*'],
          actions: ['logs:CreateLogGroup']
        }),
        new iam.PolicyStatement({
          resources: [`arn:aws:logs:*:*:log-group:/aws/lambda/EmailMVTLogArchiver-${props.stage}:*`],
          actions: ['logs:CreateLogStream', 'logs:PutLogEvents']
        }),
        new iam.PolicyStatement({
          resources: [`arn:aws:s3:::${props.sourceBucketName}`, `arn:aws:s3:::${props.sourceBucketName}/*`],
          actions: ['s3:GetObject', 's3:ListBucket']
        }),
        new iam.PolicyStatement({
          resources: [`arn:aws:s3:::${props.destinationBucketName}/*`],
          actions: ['s3:GetObject','s3:PutObject','s3:PutObjectAcl']
        }),
      ],
      environment: {
        'source_s3_bucket': props.sourceBucketName,
        'destination_s3_bucket': props.destinationBucketName
      }
    });

    // Run every day at 6PM UTC
    // See https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html
    const rule = new events.Rule(this, 'Rule', {
      schedule: events.Schedule.expression('cron(0 1 ? * * *)')
    });

    rule.addTarget(new targets.LambdaFunction(lambdaToCopyFiles));
  }

}