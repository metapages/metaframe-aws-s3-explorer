# Metaframe: AWS S3 Explorer

Forked from [Authress-Engineering/aws-s3-explorer](https://github.com/Authress-Engineering/aws-s3-explorer) and adapted for Metapages

This is an S3 Explorer for AWS. It provides a simple and straightforward way for users to explore available S3 Buckets. Everything is done in the browser and requires only minimal setup using access keys

This is an open source project managed by the [Metapages Engineering team](https://metapage.io).

## The S3 Explorer:
![Folder selected screen](screenshots/explorer-folder.png)

### Configuration: The only setup step
Jump over to the [AWS S3 explorer configuration](https://console.rhosys.ch) to deploy the Cognito CFN template, and configure your SSO provider. That's it!
* [Custom configuration](./docs/configuration.md)

<!-- ## Display Options

This application allows visitors to view the contents of a bucket via its folders or by listing out all objects in a bucket. The default view is by folder, but users can choose Initial View: Bucket in Settings to display all objects in the bucket. Note that viewing an entire bucket that contains many objects could overwhelm the browser. We've successfully tested this application on a bucket with over 30,000 objects, but keep in mind that trying to list too many objects in a browser could lead to a poor user experience. -->

## Troubleshooting
If you run into any problems just try running through the suggested [Troubleshooting steps](./docs/troubleshooting.md) and if that doesn't help, [file an issue](https://github.com/metapages/metaframe-aws-s3-explorer/issues), we are usually quick to respond.

## Standard use cases:

View all objects in folder:
![Folder selected screen](screenshots/explorer-folder.png)

View all objects in bucket:
![Bucket traversal screen](screenshots/explorer-bucket.png)

Upload objects to a bucket:
![Bucket upload request screen](screenshots/explorer-upload.png)

Upload objects to a bucket succeeded:
![Bucket upload confirmation screen](screenshots/explorer-upload-success.png)

Delete objects from a bucket:
![Bucket object delete request screen](screenshots/explorer-delete.png)

Delete objects from a bucket succeeded:
![Bucket object delete confirmation screen](screenshots/explorer-delete-success.png)

## Contribution

### Development
This project uses Vue 3, and as this is much different from Vue 2, recommend reading is available:
* [General Updates](https://v3.vuejs.org/guide/computed.html)
* [Script Setup tags](https://v3.vuejs.org/api/sfc-script-setup.html)

### Troubleshooting builds
**Error: OpenIDConnect provider's HTTPS certificate doesn't match configured thumbprint** - Update AWS IAM to use the thumbprint details of the issue [are available here](https://github.com/aws-actions/configure-aws-credentials/issues/357).
