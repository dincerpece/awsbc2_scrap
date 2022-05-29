const mysql = require('mysql');
const whoiser = require('whoiser');
require('dotenv').config();
let connection = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
    port: process.env.port
});
const run = function () {
    connection = mysql.createConnection({
        host: process.env.host,
        user: process.env.user,
        password: process.env.password,
        database: process.env.database,
        port: process.env.port
    });
    connection.connect(function(err) {

        if (err) {
            console.error('Veri tabanına bağlanırken hata, ' + err.stack);

        }

        let sql = "SELECT * FROM domain_table where status = 1 and dns = 2 limit 10";
        connection.query(sql, function (err, result) {
            console.log(result.length);
            result.map(statusUpdate);
            function statusUpdate(row) {
                let sql2 = "UPDATE domain_table SET status = 2 WHERE id = " + row.id + ";";
                connection.query(sql2, function (err, result) {
                    // console.log(result);
                })

            }


             let ban_tld4 = [
                 '.mil',
                '.gov',
                '.edu',
             ];
            let ban_tld3 = [
                '.va',
                '.gr',
                '.za',

            ];

            result.map(whoisupdate);
            function whoisupdate(row) {
                if (ban_tld4.includes(row.domain.slice(row.domain.length - 4))){
                   return;
                }
                if (ban_tld3.includes(row.domain.slice(row.domain.length - 3))){
                    return;
                }

                if (row.domain.includes(ban_tld4)){
                    return;
                }

                try{
                (async () => {
                    //const domainName = 'cloudflare.com'
                    const domainName = row.domain;


                        // retrieve WHOIS info from Registrar WHOIS servers
                        const domainWhois = await whoiser(domainName, { follow: 1 })



                    const firstDomainWhois = whoiser.firstResult(domainWhois)
                    const firstTextLine = (firstDomainWhois.text[0] || '').toLowerCase()

                    let domainAvailability = 'unknown'

                    if (firstTextLine.includes('reserved')) {
                        domainAvailability = 'reserved'
                    } else if (firstDomainWhois['Domain Name'] && firstDomainWhois['Domain Name'].toLowerCase() === domainName) {
                        domainAvailability = 'registered'
                    } else if (firstTextLine.includes(`no match for "${domainName}"`)) {
                        domainAvailability = 'available'
                    }

                    console.log(`Domain "${domainName}" is "${domainAvailability}"`)

                    if (domainAvailability === 'registered') {
                        // console.log('Domain was registered on', firstDomainWhois['Created Date'], 'at', firstDomainWhois.Registrar)
                        // console.log('Registration will expire on', firstDomainWhois['Expiry Date'])
                        // console.log('Domain uses name servers:', firstDomainWhois['Name Server'])
                    } else if (domainAvailability === 'available') {
                        console.log('This domain is available for registration right now')
                        let sql4 = "UPDATE domain_table SET status = 9 WHERE id = " + row.id + ";";
                        connection.query(sql4, function (err, result) {
                            console.log(result)
                        })

                    }

                })();


                }catch (error) {
                    console.error(error);

                    // expected output: ReferenceError: nonExistentFunction is not defined
                    // Note - error messages will vary depending on browser
                }




            }



        })


    })
};




setInterval(async function () {

    connection.end(function(err) {
        console.log("The connection is terminated now");
        run();
    });

},10000);