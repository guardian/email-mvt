import type { GuStackProps } from '@guardian/cdk/lib/constructs/core';
import { GuStack } from '@guardian/cdk/lib/constructs/core';
import type { App } from 'aws-cdk-lib';
import {Runtime} from "aws-cdk-lib/aws-lambda";
import {Duration, RemovalPolicy} from "aws-cdk-lib";
import {PolicyStatement} from "aws-cdk-lib/aws-iam";
import {Schedule} from "aws-cdk-lib/aws-events";
import {GuScheduledLambda} from "@guardian/cdk";
import {GuS3Bucket} from "@guardian/cdk/lib/constructs/s3";

export class EmailMVTPixelLogArchiver extends GuStack {
	constructor(scope: App, id: string, props: GuStackProps) {
		super(scope, id, props);

		const lowerCaseStage = props.stage.toLowerCase();
		const sourceBucketNameStagePrefix = props.stage === 'PROD' ? 'logs-email.' : `logs-email-${lowerCaseStage}.`;
		const sourceBucketNameSuffix = 'mvt.theguardian.com'
		const desinationBucketNamePrefix = props.stage === 'PROD' ? '' : `${lowerCaseStage}-`;
		const destinationBucketNameSuffix = 'ophan-raw-email-mvt-pixel-logs';
		const functionName = `${id}-${props.stage}`;

		// Create non-source and destination buckets
		if (props.stage !== 'PROD') {
			new GuS3Bucket(
				this,
				`SourceS3Bucket`,
				{
					app: id,
					bucketName:  `${sourceBucketNameStagePrefix}${sourceBucketNameSuffix}`,
					lifecycleRules: [{
						expiration: Duration.days(28),
					}],
				}
			);
			new GuS3Bucket(
				this,
				`DestinationS3Bucket`,
				{
					app: id,
					bucketName:  `${desinationBucketNamePrefix}${destinationBucketNameSuffix}`,
					lifecycleRules: [{
						expiration: Duration.days(1),
					}],
				}
			);
		}

		new GuScheduledLambda(
			this,
			'TransferLambda',
			{
				app: id,
				functionName,
				fileName: `email-mvt-pixel-log-archiver-lambda.zip`,
				handler: 'email-mvt-pixel-log-archiver-lambda.handler',
				runtime: Runtime.NODEJS_16_X,
				memorySize: 768,
				timeout: Duration.seconds(60),
				initialPolicy: [
					new PolicyStatement({
						sid: 'CreateLogGroupForFunction',
						resources: ['arn:aws:logs:*:*:*'],
						actions: ['logs:CreateLogGroup']
					}),
					new PolicyStatement({
						sid: 'EnableLambdaToLogToCloudWatch',
						resources: [`arn:aws:logs:*:*:log-group:/aws/lambda/${functionName}:*`],
						actions: ['logs:CreateLogStream', 'logs:PutLogEvents']
					}),
					new PolicyStatement({
						sid: 'GiveLambdaAccessToSourceBucket',
						resources: [
							`arn:aws:s3:::${sourceBucketNameStagePrefix}${sourceBucketNameSuffix}`,
							`arn:aws:s3:::${sourceBucketNameStagePrefix}${sourceBucketNameSuffix}/*`],
						actions: ['s3:GetObject', 's3:ListBucket']
					}),
					new PolicyStatement({
						sid: 'GiveLambdaAccessToDestinationBucket',
						resources: [`arn:aws:s3:::${desinationBucketNamePrefix}${destinationBucketNameSuffix}/*`],
						actions: ['s3:GetObject','s3:PutObject','s3:PutObjectAcl']
					}),
				],
				rules: [{
					schedule: Schedule.expression('cron(10 1 ? * * *)') // 10-past-1 gives time for CW logs to update
				}],
				monitoringConfiguration: { noMonitoring: true },
				environment: {
					'source_s3_bucket': `${sourceBucketNameStagePrefix}${sourceBucketNameSuffix}`,
					'destination_s3_bucket': `${desinationBucketNamePrefix}${destinationBucketNameSuffix}`
				}
			}
		);
	}
}