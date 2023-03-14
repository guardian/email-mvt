import { GuCertificate } from '@guardian/cdk/lib/constructs/acm';
import type { GuStackProps } from '@guardian/cdk/lib/constructs/core';
import { GuStack } from '@guardian/cdk/lib/constructs/core';
import { GuStringParameter } from '@guardian/cdk/lib/constructs/core/parameters/base';
import type { App } from 'aws-cdk-lib';

interface EmailMVTPixelCertificateProps extends GuStackProps {
	app: string;
}

export class EmailMVTPixelCertificate extends GuStack {
	constructor(scope: App, id: string, props: EmailMVTPixelCertificateProps) {
		super(scope, id, props);

		const hostedZoneParameter = new GuStringParameter(this, 'Hosted Zone ID', {
			description: 'Hosted Zone ID to register automatic validation',
		});

		const hostedZoneName = new GuStringParameter(this, 'Hosted Zone Name', {
			description: 'Hosted Zone Name to register automatic validation',
		});

		const domainNamePrefix = `email${(props.stage === 'PROD') ? '' : `-${props.stage.toLowerCase()}`}`;

		const domainName = `${domainNamePrefix}.${hostedZoneName.valueAsString}`

		new GuCertificate(this, {
			app: props.app,
			domainName: domainName,
			hostedZoneId: hostedZoneParameter.valueAsString,
		});
	}
}
