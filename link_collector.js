const request = require("request");
const cheerio = require("cheerio");
const psl = require('psl');
const regex = /https?:\/\/(www\.)?([-a-zA-Z\d@:%._+~#=]{1,256}\.[a-zA-Z\d()]{1,6}\b)([-a-zA-Z\d()@:%_+.~#?&/=]*)/;
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const dataPath = path.join(__dirname, 'data/');
const pushPath = path.join(__dirname, 'push/');
const combineFiles = require('combine-files');

require('dotenv').config();

const s3 = new AWS.S3({
    accessKeyId: process.env.AKID,
    secretAccessKey: process.env.SAC
});


function uploadFile2(pushFilePath,pushFileName) {
    const fileStream = fs.createReadStream(pushFilePath);
    const uploadParams = {
        Bucket: process.env.bucket,
        Body: fileStream,
        Key: 'raw/' + pushFileName,
    };

    return s3.upload(uploadParams).promise();
}






let c = 0;


const filterList = [
    'wiktionary.org',
    'wikipedia.org',
    'wikimedia.org',
    'wikidata.org',
    'mediawiki.org',
    'wikimediafoundation.org',
    'archive.org',
    'google.com'
]


async function push_data(domains) {
    if (typeof domains == "undefined" || domains.length < 1) {
        getDomains();
        return false;
    }

    let now = Date.now().toString();

    const file = fs.createWriteStream(dataPath + now + '.txt' );


    file.on('error', (err) => {
        console.log(err);

    });

    await domains.forEach((v) => {
        file.write(v + '\n');
    });

    file.end();
    return true;

}


function garbageCollector () {
    fs.readdir(dataPath,  async function (err, files) {

        console.log('gargabe collector started');


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


        await uploadFile2(pushFilePath,pushFileName);

        return true;


    });

}







const getDomains = function () {
    request('https://en.wikipedia.org/wiki/Special:Random', function (error, response, html) {
         c++;

        if (error || response.statusCode !== 200) {
            return false;
        }

        let $ = cheerio.load(html);
        let links = $('a');
        let domains = [];
        $(links).each(function(i, link){

            let m;


            if ((m = regex.exec($(link).attr('href'))) !== null) {

                // console.log(m)
                let parsed = psl.parse(m[2]);



                if (parsed.domain && !domains.includes(parsed.domain) && !filterList.includes(parsed.domain) ) {
                    domains = domains.concat(parsed.domain)
                }


            }



        });

        push_data(domains).then( function (){
                if (c % 10 === 0 ) {
                     garbageCollector();

                        getDomains();

                }else {

                    getDomains();
                }
        }
        );

    });
};

 getDomains();