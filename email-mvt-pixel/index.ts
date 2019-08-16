import cdk = require('@aws-cdk/core');
import {EmailMVTPixel} from './lib/EmailMVTPixel';
import {StackStage} from "../shared-ts/helpers";

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


        this.node.applyAspect(new cdk.Tag('App', name));
        this.node.applyAspect(new cdk.Tag('Stack', stackName.valueAsString));
        this.node.applyAspect(new cdk.Tag('Stage', stage.valueAsString));

        const infrastructure = new EmailMVTPixel(this, name, {
          certificateArn: certificateArn.valueAsString,
          tld: tld.valueAsString,
          hostedZoneId: hostedZoneId.valueAsString,
          stageSubdomain: stageSubdomain.valueAsString,
        });

        new cdk.CfnOutput(this, `${name}CFLogs_S3Bucket_Output`, {
            value: infrastructure.bucketForCFLogs.bucketName,
            exportName: `EmailMVTPixel-Logs-S3Bucket-${stage.valueAsString}`
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
