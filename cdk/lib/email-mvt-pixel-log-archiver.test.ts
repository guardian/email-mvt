import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { EmailMVTPixelLogArchiver } from './email-mvt-pixel-log-archiver';

describe('The EmailMVTPixel stack', () => {
	it('matches the snapshot', () => {
		const app = new App();
		const stack = new EmailMVTPixelLogArchiver(app, 'EmailMVTPixelLogArchiver', {
			stack: 'targeting',
			stage: 'TEST',
		});
		const template = Template.fromStack(stack);
		console.log(template.toJSON());
		expect(template.toJSON()).toBeDefined();
	});
});
