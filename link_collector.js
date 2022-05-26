const request = require("request");
const cheerio = require("cheerio");
const mysql = require('mysql');
const psl = require('psl');
const regex = /https?:\/\/(www\.)?([-a-zA-Z\d@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b)([-a-zA-Z\d()@:%_+.~#?&/=]*)/;

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

let db_config = {
    host: 'domain-db.cluster-cgg12lpoesft.eu-west-1.rds.amazonaws.com',
    user: 'synan',
    password: 'ZixiaoXrkozmKHJbtpK4',
    port: '63306',
    database: 'domain',
};


const push_data = function (domains) {
    if (typeof domains == "undefined" || domains.length < 1) {
        getDomains();
        return;
    }
    const connection = mysql.createConnection(db_config);

    for (let i=0;i<domains.length;i++) {
        connection.query('INSERT INTO domain_table SET ?', {domain: domains[i]}, function (error, results, fields) {
            if (error) throw error;
            console.log(results.insertId);
        });

    }

    getDomains();


};

const getDomains = function () {
    request('https://en.wikipedia.org/wiki/Special:Random', function (error, response, html) {


        if (error || response.statusCode !== 200) {
            return false;
        }

        let $ = cheerio.load(html);
        let links = $('a');
        let domains = [];
        $(links).each(function(i, link){

            let m;


            if ((m = regex.exec($(link).attr('href'))) !== null) {
                // The result can be accessed through the `m`-variable.
                // console.log(m[2]);

                let parsed = psl.parse(m[2]);



                if (parsed.domain && !domains.includes(parsed.domain) && !filterList.includes(parsed.domain) ) {
                    domains = domains.concat(parsed.domain)
                }


            }


            // console.log($(link).attr('href'));
        });

        push_data(domains)





    });
};




getDomains();






