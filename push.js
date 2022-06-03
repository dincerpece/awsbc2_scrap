const AWS = require('aws-sdk');
const fs = require("fs");

let s3 = new AWS.S3({
  accessKeyId: 'AKIAQZY3J4S4GOIV56FO',
  secretAccessKey: '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'
});


const uploadFile = (fileName) => {
  // Read content from the file
  const fileContent = fs.readFileSync(fileName);

  // Setting up S3 upload parameters
  const params = {
    Bucket: 'awsbc1-domain',
    Key: 'raw/catss.txt', // File name you want to save as in S3
    Body: fileContent
  };

  // Uploading files to the bucket
  s3.upload(params, function(err, data) {
    if (err) {
      throw err;
    }
    console.log(`File uploaded successfully. ${data.Location}`);
  });
};

uploadFile('/Users/synan/Documents/WebstormProjects/scrap/push/1653813602206.txt');

