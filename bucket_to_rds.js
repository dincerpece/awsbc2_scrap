require('dotenv').config();
const mysql = require('mysql');
let connection = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
    port: process.env.port
});
const AWS = require('aws-sdk');
AWS.config.update({accessKeyId: process.env.AKID, secretAccessKey: process.env.SAC, region: process.env.region});
const s3 = new AWS.S3();

let params = {
    Bucket: 'awsbc1-domain',
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
    connection.connect(async function (err) {
        if (err) {
            console.log(err)
        }

        const bucketName = 'awsbc1-domain';
        const folderToMove = 'raw/';
        const destinationFolder = 'finished/';
        try {


            await Promise.all(
                data.Contents.map(async (fileInfo) => {
                    let sql = "LOAD DATA FROM S3 's3://awsbc1-domain/" + fileInfo.Key + "' INTO TABLE domain.domain_table FIELDS TERMINATED BY ',' LINES TERMINATED BY '\n' (domain);";
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
            );
        } catch (err) {
            console.error(err); // error handling
        }

    })

};


setInterval(async function () {

    connection.end(function(err) {
        console.log("The connection is terminated now");
        run();
    });

},60000);