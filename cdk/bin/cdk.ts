import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { EmailMVTPixel } from '../lib/email-mvt-pixel';
import { EmailMVTPixelCertificate } from '../lib/email-mvt-pixel-certificate';
import { EmailMVTPixelLogArchiver } from '../lib/email-mvt-pixel-log-archiver';

const app = new App();
// Deployed in us-east-1 so it can be used by CloudFront
new EmailMVTPixelCertificate(app, 'EmailMVTPixelCertificate-TEST', {
	app: 'EmailMVTPixelCertificate',
	stack: 'targeting',
	stage: 'TEST',
});
// Deployed in us-east-1 so it can be used by CloudFront
new EmailMVTPixelCertificate(app, 'EmailMVTPixelCertificate-PROD', {
	app: 'EmailMVTPixelCertificate',
	stack: 'targeting',
	stage: 'PROD',
});
new EmailMVTPixel(app, 'EmailMVTPixel-TEST', {
	app: 'EmailMVTPixel',
	stack: 'targeting',
	stage: 'TEST',
});
new EmailMVTPixel(app, 'EmailMVTPixel-PROD', {
	app: 'EmailMVTPixel',
	stack: 'targeting',
	stage: 'PROD',
});
new EmailMVTPixelLogArchiver(app, 'EmailMVTPixelLogArchiver-TEST', {
	stack: 'targeting',
	stage: 'TEST',
});
new EmailMVTPixelLogArchiver(app, 'EmailMVTPixelLogArchiver-PROD', {
	stack: 'targeting',
	stage: 'PROD',
});
