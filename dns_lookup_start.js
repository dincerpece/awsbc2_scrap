
const dns = require('dns');
const mysql = require('mysql');
const moment = require('moment-timezone');
moment.locale('tr');
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
            return;
        }
        console_info('Veritabanına başarı ile bağlanıldı');
        let sql = "SELECT * FROM domain_table where status = 0 limit 100";

        connection.query(sql, function (err, result) {

            if (result.length > 0) {



                result.map(statusUpdate)

                function statusUpdate(row) {
                    let sql2 = "UPDATE domain_table SET status = 1 WHERE id = " + row.id + ";";
                    connection.query(sql2, function (err, result) {
                        // console.log(result);
                    })

                }

                result.map(dns_res);

                function dns_res(row){
                    dns.lookup(row.domain, {all:false,family:4}, function (err, address, family){
                            if (err) {
                                let sql3 = "UPDATE domain_table SET dns = 2 WHERE id = " + row.id + ";";
                                connection.query(sql3, function (err, result) {
                                    // console.log(result);
                                })
                            }else {
                                let sql4 = "UPDATE domain_table SET dns = 1 WHERE id = " + row.id + ";";
                                connection.query(sql4, function (err, result) {
                                    // console.log(result);
                                })
                            }
                        }
                    );
                }
            }

        });
    });
}



setInterval(async function () {

        connection.end(function(err) {
            console.log("The connection is terminated now");
           run();
        });

},10000);


function console_info (message){
    console.log(`${message}. Zaman Damgası: [ ` + moment.tz("TURKEY").format('LLLL:ss:SS') + ` ]`);
}