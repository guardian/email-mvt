import cdk = require('@aws-cdk/core');
import { EmailMVTPixel } from './lib/EmailMVTPixel';

export enum StackStage {
  Code = 'code',
  Prod = 'prod',
}

class EmailMVTStack extends cdk.Stack {

    constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props);

        const stage = new cdk.CfnParameter(this, 'Stage', {
            type: 'String',
            default: StackStage.Code,
            allowedValues: [StackStage.Code, StackStage.Prod],
        });

        const hostedZoneId = new cdk.CfnParameter(this, 'Hosted Zone ID', {
            type: 'String'
        });

        const tld = new cdk.CfnParameter(this, 'Top Level Domain (TLD)', {
            type: 'String',
            default: 'targeting.guardianapis.com',
        });

        const certificateArn = new cdk.CfnParameter(this, 'CloudFront ACM Certificate ARN', {
            type: 'String'
        });

        this.node.applyAspect(new cdk.Tag('Stage', stage.valueAsString));

        new EmailMVTPixel(this, 'EmailMVTPixel', {
            certificateArn,
            tld,
            hostedZoneId,
            stage,
        });
    }
}

const app = new cdk.App();

new EmailMVTStack(app, 'EmailMVTStack', {
    env: { region: 'eu-west-1' },
    tags: {
        App: 'EmailMVTPixel',
        Stack: 'targeting',
        Stage: StackStage.Code,
    }
});

app.synth();
