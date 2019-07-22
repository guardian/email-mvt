#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { EmailMvtStack } from '../lib/email-mvt-stack';

const app = new cdk.App();
new EmailMvtStack(app, 'EmailMvtStack');
