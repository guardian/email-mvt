import cdk = require('@aws-cdk/core');
import { EmailMVTPixel } from './lib/EmailMVTPixel';

export enum StackStage {
  Code = 'CODE',
  Prod = 'PROD',
}

class EmailMVTStack extends cdk.Stack {

    constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props);

        const stackName =  new cdk.CfnParameter(this, 'Stack', {
            type: 'String',
            default: 'targeting'
        });

        const stage = new cdk.CfnParameter(this, 'Stage', {
            type: 'String',
            default: StackStage.Code,
            allowedValues: [StackStage.Code, StackStage.Prod],
        });

        const stageSubdomain = new cdk.CfnParameter(this, 'Stage Subdomain', {
            type: 'String',
            default: 'email',
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


        this.node.applyAspect(new cdk.Tag('App', this.node.tryGetContext('App')));
        this.node.applyAspect(new cdk.Tag('Stack', stackName.valueAsString));
        this.node.applyAspect(new cdk.Tag('Stage', stage.valueAsString));

        new EmailMVTPixel(this, this.node.tryGetContext('App'), {
            certificateArn,
            tld,
            hostedZoneId,
            stage,
            stageSubdomain,
        });
    }
}

const app = new cdk.App({
    context: { 'App': 'EmailMVTPixel', 'Stack': 'targeting' }
});

new EmailMVTStack(app, app.node.tryGetContext('App'), {
    env: { region: 'eu-west-1' }
});

app.synth();
