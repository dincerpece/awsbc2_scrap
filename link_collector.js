const request = require("request");const cheerio = require("cheerio");const psl = require('psl');const regex = /https?:\/\/(www\.)?([-a-zA-Z\d@:%._+~#=]{1,256}\.[a-zA-Z\d()]{1,6}\b)([-a-zA-Z\d()@:%_+.~#?&/=]*)/;const fs = require('fs');const path = require('path');const AWS = require('aws-sdk');const dataPath = path.join(__dirname, 'data/');const pushPath = path.join(__dirname, 'push/');const combineFiles = require('combine-files');require('dotenv').config();console.log(process.env.AKID);console.log(process.env.SAC);const s3 = new AWS.S3({    accessKeyId: process.env.AKID,    secretAccessKey: process.env.SAC});const uploadFile = (fileName) => {    // Read content from the file    const fileContent = fs.readFileSync(fileName);    // Setting up S3 upload parameters    const params = {        Bucket: 'awsbc1-domain-bucket',        Key: 'raw/' + fileName, // File name you want to save as in S3        Body: fileContent    };    // Uploading files to the bucket    s3.upload(params, function(err, data) {        if (err) {            throw err;        }        console.log(`File uploaded successfully. ${data.Location}`);    });};let c = 0;const filterList = [    'wiktionary.org',    'wikipedia.org',    'wikimedia.org',    'wikidata.org',    'mediawiki.org',    'wikimediafoundation.org',    'archive.org',    'google.com']async function push_data(domains) {    if (typeof domains == "undefined" || domains.length < 1) {        getDomains();        return false;    }    let now = Date.now().toString();    const file = fs.createWriteStream(dataPath + now + '.txt' );    file.on('error', (err) => {        console.log(err);    });    await domains.forEach((v) => {        file.write(v + '\n');    });    file.end();    return true;}function garbageCollector () {    fs.readdir(dataPath,  async function (err, files) {        console.log('gargabe collector started');        let files_map = files.map(x => (dataPath + x).toString());        if (err) {            return console.log('Unable to scan directory: ' + err);        }        let now = Date.now().toString();        let pushFile = pushPath + now + '.txt';        combineFiles(files_map, pushFile);        await files_map.forEach(function (deleteFilePath) {            try {                fs.unlinkSync(deleteFilePath);            } catch (err) {                console.error(err);            }        });        uploadFile(pushFile);        return true;    });};const getDomains = function () {    request('https://en.wikipedia.org/wiki/Special:Random', function (error, response, html) {         c++;        if (error || response.statusCode !== 200) {            return false;        }        let $ = cheerio.load(html);        let links = $('a');        let domains = [];        $(links).each(function(i, link){            let m;            if ((m = regex.exec($(link).attr('href'))) !== null) {                // The result can be accessed through the `m`-variable.                // console.log(m[2]);                let parsed = psl.parse(m[2]);                if (parsed.domain && !domains.includes(parsed.domain) && !filterList.includes(parsed.domain) ) {                    domains = domains.concat(parsed.domain)                }            }        });        push_data(domains).then( function (){                if (c % 100 === 0 ) {                    garbageCollector();                        getDomains();                }else {                    getDomains();                }        }        );    });};// getDomains();