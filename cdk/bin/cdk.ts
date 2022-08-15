import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { EmailMVTPixelLogArchiver } from '../lib/email-mvt-pixel-log-archiver';

const app = new App();
new EmailMVTPixelLogArchiver(app, 'EmailMVTPixelLogArchiver', {
	stack: 'targeting',
	stage: 'TEST',
});
