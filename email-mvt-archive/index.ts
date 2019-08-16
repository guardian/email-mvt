#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { EmailMVTLogArchiverStack } from './lib/EmailMVTLogArchiver';

const app = new cdk.App();
new EmailMVTLogArchiverStack(app, 'EmailMVTLogArchiverStack');
