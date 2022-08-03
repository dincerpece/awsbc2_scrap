require('dotenv').config();
const mysql = require('mysql');
const AWS = require('aws-sdk');
let connection = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
    port: process.env.port
});

AWS.config.update({accessKeyId: process.env.AccessKeyId, secretAccessKey: process.env.SecretAccessKey, region: process.env.region});
const s3 = new AWS.S3();

let params = {
    Bucket: 'last-new-bucket',
    Delimiter: '/',
    Prefix: 'raw/'
}
const run = function (){
    s3.listObjects(params, function (err, data) {
        if(err)throw err;
        console.log(data);
        bulk_insert(data)
    });

}



const bulk_insert = function (data) {

        const bucketName = 'last-new-bucket';
        const folderToMove = 'raw/';
        const destinationFolder = 'finished/';
        try {
            Promise.all(
              data.Contents.map(async (fileInfo) => {
                  let sql = "LOAD DATA FROM S3 's3://last-new-bucket/" + fileInfo.Key + "' INTO TABLE domain_mining.domain_table FIELDS TERMINATED BY ',' LINES TERMINATED BY '\n' (domain);";
                  await connection.query(sql, async function (err, result) {

                      await s3.copyObject({
                          Bucket: bucketName,
                          CopySource: `${bucketName}/${fileInfo.Key}`,
                          Key: `${destinationFolder}${fileInfo.Key.replace(folderToMove, '')}`,
                      }).promise();

                      await s3.deleteObject({
                          Bucket: bucketName,
                          Key: fileInfo.Key,
                      }).promise();
                  })

              })
            ).then(r =>  r );
        }  catch (err) {
            console.error(err); // error handling
        }
};


setInterval( function () {
    run();
},60000);


run();