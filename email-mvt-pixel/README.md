Email Multi-variant Targeting - Tracking Pixel
----------------------------------------------

The [../cdk](../cdk) folder contains the [GuCDK v2 code](https://github.com/guardian/cdk) to build the pixel to collect multi-variant information.

In PROD the pixel tracker is deployed on the: `email.mvt.theguardian.com` domain. [See here](https://email.mvt.theguardian.com/1.gif).
    
## Example use-case of pixel tracker in an email:

```html
<html lang="en">
  <head>
      <title>Example for README.md</title>
      <img alt="I only track opens" src="https://ablink.email.theguardian.com/tracker_from_the_esp.gif?foo=bar"/>
  </head>
  <body>
    <!-- … -->
    <img alt="I track what content component a user saw in placement 1" src="https://email.mvt.theguardian.com/1.gif?campaign=1&variant=Contributions_Banner_A&placement=1&userId=123"/>
    <!-- … -->
    <img alt="I track what content component a user saw in placement 2" src="https://email.mvt.theguardian.com/1.gif?campaign=1&variant=DigitalPack_Banner_B&placement=2&userId=123"/>
    <!-- … -->
    <img alt="I track what content component a user saw in placement 3" src="https://email.mvt.theguardian.com/1.gif?campaign=1&variant=Newsletter_Banner_A&placement=3&userId=123"/>
    <!-- … -->
    <img alt="I track what content component a user saw in placement 4" src="https://email.mvt.theguardian.com/1.gif?campaign=1&variant=GuardianWeekly_Banner_B&placement=4&userId=123"/>
    <!-- … -->
  </body>
</html>
``` 
The CloudFront logs are stored in an S3 bucket with a 2-week retention policy.
 
There is another CDK stack and [Lambda function](../email-mvt-archive) which defines a scheduled Lambda function which 
shard these CloudFront logs each day into a folder where eventually [BigQuery](https://github.com/guardian/data-platform-models/blob/3a8aff52ab59df8c49e656afff6c96dbd6b37cae/dbt/models/datalake/braze/email_mvt_pixel_impressions.sql) 
(or [Athena](../email-mvt-athena) if you want to debug in the AWS Targeting account) plucks out the query parameters 
into a table representing what content variants the user saw that day.