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

let c = 0;
const filterList = [
  'google.com'
]

const tld_list = ['com', 'net'];

const run = function () {
  async.waterfall([
    function (callback) {
      let domains = [];
      request('https://en.wikipedia.org/wiki/Special:Random', function (error, response, html) {
        c++;

        if (error || response.statusCode !== 200) {
          callback(null, null);
        }

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

        callback(null,domains);
      });



    },
    function (domains, callback) {
      console.log(domains);
      if (typeof domains == "undefined" || domains.length < 1) {
        callback('no domain', null);
      }else{
        callback(null, domains);
      }


    },
    function (domains, callback) {
      let now = Date.now().toString();

      const file = fs.createWriteStream(dataPath + now + '.txt' );

      callback(null, file,domains);
    },
    function (file, domains, callback) {
      console.log('function 3')

      let now = Date.now().toString();


      // file.on('error', (err) => {
      //   console.log(err);
      //   callback(err, 'done');
      // });

      domains.forEach((v) => {
        file.write(v + '\n');
      });
      // file.on('end', function() {
      //   console.log("EOF");
      // });

      file.on('error', function(err) {
        console.log("ERRORRRRRRRRRRRRRRRRRRRRRRRR:" + err);
        callback(err, null);


      });
      file.on('finish', function() {
        console.log('onFinish');
       
      })

      file.on('close', function() {
        console.log("CLOSE");
        callback(null, null)
      });

      // file.on("error", function(err) {
      //   console.log('err callbackkkkkkkkkkkkkkkkkkkkkkkkk');
      //
      //   callback(err, null);
      // });
      //   file.on("open", function() {
      //     console.log('file_on_finish hehehe')
      //     file.close(() => {
      //       console.log('close hehehe')
      //       callback(null, file);
      //     });
      //   });



      //callback(null, file);
    },
    function ( file,callback) {

      // file.end();
      console.log('function 4')
      callback(null, 'done');
    },
    function (arg1, callback) {
      // arg1 now equals 'three'
      // console.log('function 5')
      callback(null, 'done');
    },
    function (arg1, callback) {
      // arg1 now equals 'three'
      // console.log('function 6')
      callback(null, 'done');
    }
  ], function (err, result) {
    if(err) {
      console.log(err + ', error :( ');
      run();
    }else{
      run();
    }


  });
};



run();




