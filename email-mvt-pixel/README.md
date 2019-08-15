Email Multi-variant Targeting - Tracking Pixel
----------------------------------------------

This folder contains the AWS CDK code to build the pixel to collect multi-variant information.

In PROD this is deployed on the: `email.mvt.theguardian.com` domain.

## Instructions to build and run:
 - Setup steps (in this folder):
    1. `brew install node`
    2. `brew install npm`
    3. `npm install`
    
 - When you are ready to generate a new `template.yaml` file for uploading:
    1. `npm run build`
    2. `npm run cdk`
    
## Example use-case of pixel tracker in an email:

```
<html lang="en">
<head>
<img alt="I only track opens" src="https://ablink.email.theguardian.com/tracker_from_the_esp.gif?foo=bar"/>
</head>
<body>
...
<img alt="I track what content component a user saw" src="https://email.mvt.theguardian.com/1.gif?campaign=1&variant=Contributions_Banner_A&placement=1&userId=123"/>
...
<img alt="I track what content component a user saw"src="https://email.mvt.theguardian.com/1.gif?campaign=1&variant=DigitalPack_Banner_B&placement=2&userId=123"/>
...
<img alt="I track what content component a user saw" src="https://email.mvt.theguardian.com/1.gif?campaign=1&variant=Newsletter_Banner_A&placement=1&userId=123"/>
...
<img alt="I track what content component a user saw" src="https://email.mvt.theguardian.com/1.gif?campaign=1&variant=GuardianWeekly_Banner_B&placement=4&userId=123"/>
...
</body>
</html>
``` 
The logs are stored in an S3 bucket with a 2-week retention policy.
 
See [here](#) for another CDK stack which defines a set of scheduled Lambda functions which 
shard these CloudFront logs each day into a folder where Athena plucks out the query 
parameters into a table representing what content variants the user saw that day.