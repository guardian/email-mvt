import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { EmailMVTPixelLogArchiver } from '../lib/email-mvt-pixel-log-archiver';

const app = new App();
new EmailMVTPixelLogArchiver(app, 'EmailMVTPixelLogArchiver-TEST', {
	stack: 'targeting',
	stage: 'TEST',
});
new EmailMVTPixelLogArchiver(app, 'EmailMVTPixelLogArchiver-PROD', {
	stack: 'targeting',
	stage: 'PROD',
});
