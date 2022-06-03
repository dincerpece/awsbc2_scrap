const async = require('async');
const AWS = require('aws-sdk');
const request = require("request");
const cheerio = require("cheerio");
const fs = require('fs');
const psl = require('psl');
const path = require('path');
const combineFiles = require('combine-files');
require('dotenv').config();
const dataPath = path.join(__dirname, 'data/');
const pushPath = path.join(__dirname, 'push/');
const regex = /https?:\/\/(www\.)?([-a-zA-Z\d@:%._+~#=]{1,256}\.[a-zA-Z\d()]{1,6}\b)([-a-zA-Z\d()@:%_+.~#?&/=]*)/;

const s3 = new AWS.S3({
  accessKeyId: process.env.AKID,
  secretAccessKey: process.env.SAC
});

let c = 0;
const filterList = [
  'google.com'
]

const tld_list = ['com', 'net'];

const garbageCollector = function  () {
  fs.readdir(dataPath,   async function (err, files) {

    console.log('garbage collector started');


    let files_map = files.map(x => (dataPath + x).toString());

    if (err) {
      return console.log('Unable to scan directory: ' + err);
    }
    let now = Date.now().toString();
    let pushFileName = now + '.txt'

    let pushFilePath = pushPath + now + '.txt';


    combineFiles(files_map, pushFilePath);

    await files_map.forEach(function (deleteFilePath) {
      try {
        fs.unlinkSync(deleteFilePath);

      } catch (err) {
        console.error(err);
      }
    });


    await uploadFile2(pushFilePath, pushFileName);




  });

}

const uploadFile2 = function (pushFilePath,pushFileName) {
  const fileStream = fs.createReadStream(pushFilePath);
  const uploadParams = {
    Bucket: process.env.bucket,
    Body: fileStream,
    Key: 'raw/' + pushFileName,
  };

   s3.upload(uploadParams).promise();
}

const run = function () {
  async.waterfall([
    function (callback) {
      let domains = [];
      request('https://en.wikipedia.org/wiki/Special:Random', function (error, response, html) {
        c++;
        console.log(c);


        if (error || response.statusCode !== 200) {
          callback(error, null);
        } else {

          let $ = cheerio.load(html);
          let links = $('a');
          let m;

          $(links).each(function (i, link) {
            if ((m = regex.exec($(link).attr('href'))) !== null) {

              // console.log(m[2])
              let parsed = psl.parse(m[2]); // pahalli_islem

              if (parsed.domain
                && !domains.includes(parsed.domain)
                && !filterList.includes(parsed.domain)) {
                if (tld_list.includes(parsed.tld)) {
                  domains = domains.concat(parsed.domain);
                }
              }
            }
          });

          callback(null, domains);
        }
      });

    },
    function (domains, callback) {
      console.log('domains');
      console.log(domains);
      if (typeof domains == "undefined" || domains.length < 1) {
        callback('no domain', null);
      } else {
        callback(null, domains);
      }


    },
    function (domains, callback) {
      let now = Date.now().toString();

      const file = fs.createWriteStream(dataPath + now + '.txt');

      callback(null, file,domains);


    },
    function (file, domains, callback) {
      console.log('function 3')

      domains.forEach((v) => {
        file.write(v + '\n');
      });
      callback(null, file)
    },

    function (file, callback) {
      file.close();
      file.on('close', function () {
        console.log("CLOSE");
        callback(null)
      });
    },
    function ( callback) {
      if (c % 100 === 0) {
        garbageCollector();
        callback(null)
      }else{
        callback(null)
      }

    }
  ], function (err, result) {
    if (err) {

      console.log(err + ', error :( ');

      run();
    } else {
      run();
    }
  });
};




const init = function () {
  request('http://169.254.169.254/latest/meta-data/iam/security-credentials/ec2_level_1_role', function (error, response, html) {


    if (error || response.statusCode !== 200) {

    } else {
      console.log(html)

      // let $ = cheerio.load(html);
      // let links = $('a');
      // let m;

    }
  });
};


init();