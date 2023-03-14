import type { GuStackProps } from '@guardian/cdk/lib/constructs/core';
import {
	GuCertificateArnParameter,
	GuStack,
} from '@guardian/cdk/lib/constructs/core';
import { GuStringParameter } from '@guardian/cdk/lib/constructs/core/parameters/base';
import { GuS3Bucket } from '@guardian/cdk/lib/constructs/s3';
import type { App } from 'aws-cdk-lib';
import { aws_cloudfront, Duration } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { ViewerCertificate } from 'aws-cdk-lib/aws-cloudfront';
import {
	ARecord,
	HostedZone,
	RecordTarget,
} from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';

interface EmailMVTPixelProps extends GuStackProps {
	app: string;
}

export class EmailMVTPixel extends GuStack {
	constructor(scope: App, id: string, props: EmailMVTPixelProps) {
		super(scope, id, props);

		const hostedZoneParameter = new GuStringParameter(this, 'Hosted Zone ID', {
			description: 'Hosted Zone ID of Route 53 entry',
		});

		const hostedZoneName = new GuStringParameter(this, 'Hosted Zone Name', {
			description: 'Hosted Zone Name of Route 53 entry',
		});

		const certificateArnParameter = new GuCertificateArnParameter(this, {
			app: props.app,
		});

		const domainNamePrefix = `email${(props.stage === 'PROD') ? '' : `-${props.stage.toLowerCase()}`}`;

		const cloudfrontAlias = `${domainNamePrefix}.${hostedZoneName.valueAsString}`;

		const certificate = Certificate.fromCertificateArn(
			this,
			id,
			certificateArnParameter.valueAsString,
		);

		const logFiles = new GuS3Bucket(this, `CloudFrontLogsS3Bucket`, {
			app: props.app,
			bucketName: `email-mvt-pixel-cloudfront-logs-${props.stage.toLowerCase()}`,
			lifecycleRules: [
				{
					expiration: Duration.days(28),
				},
			],
		});

		const pixelSourceFiles = new GuS3Bucket(this, 'PixelS3Bucket', {
			app: props.app,
			bucketName: `email-mvt-pixel-files-${props.stage.toLowerCase()}`,
		});

		const originAccessIdentity = new aws_cloudfront.OriginAccessIdentity(
			this,
			`OriginAccessIdentity`,
			{
				comment: `Access Identity for ${pixelSourceFiles.bucketName}`,
			},
		);

		const distribution = new aws_cloudfront.CloudFrontWebDistribution(
			this,
			`PixelCloudFrontDistribution`,
			{
				viewerCertificate: ViewerCertificate.fromAcmCertificate(certificate, {
					aliases: [cloudfrontAlias],
				}),
				loggingConfig: {
					bucket: logFiles,
				},
				originConfigs: [
					{
						s3OriginSource: {
							s3BucketSource: pixelSourceFiles,
							originAccessIdentity: originAccessIdentity,
						},
						behaviors: [{ isDefaultBehavior: true }],
					},
				],
			},
		);

		const hostedZone = HostedZone.fromHostedZoneAttributes(
			this,
			'HostedZoneToSetUpCNAME',
			{
				zoneName: hostedZoneName.valueAsString,
				hostedZoneId: hostedZoneParameter.valueAsString,
			},
		);

		new ARecord(this, 'Route53AliasToCloudFront', {
			target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
			zone: hostedZone,
			recordName: cloudfrontAlias,
			ttl: Duration.hours(1),
		});
	}
}
