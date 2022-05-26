const request = require("request");
const cheerio = require("cheerio");
const psl = require('psl');
 const regex = /https?:\/\/(www\.)?([-a-zA-Z\d@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b)([-a-zA-Z\d()@:%_+.~#?&/=]*)/;
//const regex = /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b)([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

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

        console.log(domains);
        getDomains();




    });
};


getDomains();






