/**
 * Author: Michel Cojocaru
 * company: Cryptoment
 * */

/**
 * Update duration 15 min
 * Write interval 0.5 sec
 */

var cheerio = require('cheerio');
var request = require('request');
var throttledRequest = require('throttled-request')(request);
var depositDataInterval = 0.5;//seconds

throttledRequest.configure({
    requests: 1,
    milliseconds: depositDataInterval * 1000
});


const base_url = 'https://coinmarketcap.com/currencies/';
const end_url = '/#markets';
var marketsJsonList = [];

var limit = 100;

var initial_id = 1913112091000832;

Array.prototype.delayedForEach = function(callback, timeout, thisArg){
    var i = 0,
        l = this.length,
        self = this,
        caller = function(){
            callback.call(thisArg || self, self[i], i, self);
            (++i < l) && setTimeout(caller, timeout);
        };
    caller();
};

function crawlMarketAndUpdateDB(coin){
    var coinName = coin["name"].toLowerCase();
    request(base_url + coinName + end_url, function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);
            var id = coin["id"];
            var rows = $('#markets-table').find('tr');

            for (var i = 0; i < rows.length; i++) {
                var current = rows[i];

                var marketsJson = {
                    id: "",
                    exchange: "",
                    pair: "",
                    volume24h: "",
                    price: "",
                    volume: "",

                };

                marketsJson.id = $(current).children("td:nth-child(1)").text();
                marketsJson.exchange = $(current).children("td:nth-child(2)").text();
                marketsJson.pair = $(current).children("td:nth-child(3)").text();
                marketsJson.volume24h = $(current).children("td:nth-child(4)").text().replace(/(\r\n|\n|\r|\*|\**)/gm, "").trim();
                marketsJson.price = $(current).children("td:nth-child(5)").text().replace(/(\r\n|\n|\r|\*|\**)/gm, "").trim();
                marketsJson.volume = $(current).children("td:nth-child(6)").text().replace(/(\r\n|\n|\r|\*|\**|\t)/gm, "").trim().replace("%","");

                if(marketsJson.id != "") {
                    marketsJsonList.push(marketsJson);
                }

            }

            var options = {
                method: 'PUT',
                url: 'https://cryptoment-api.mybluemix.net/api/coinmarketcap_markets_models',
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    'x-ibm-client-secret': 'e399a9e4ba39d2941cb14875f7545e418a96ca905c7b7915f6199b87adde9467',
                    'x-ibm-client-id': '62384ebd-6575-4fa6-b4ef-b1886c6c7d26-bluemix'
                },
                body: {
                    "id": id,
                    "coinId": id,
                    "name": coinName,
                    "rank": coin["rank"],
                    "symbol": coin["symbol"],
                    "exchanges": marketsJsonList
                },
                json: true
            };

            throttledRequest(options, function (error, response, body) {
                if (error) return console.error('Failed: %s', error.message);
                console.log('Success: ', body);
            });

            marketsJsonList = [];

        }

    });
}

//run();

//Scrape Markets from coinmarketcap based on the name & id in the DB
exports.run = function run() {

    var options = {
        method: 'GET',
        url: 'https://cryptoment-api.mybluemix.net/api/coinmarketcap_coin_models',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'x-ibm-client-secret': 'e399a9e4ba39d2941cb14875f7545e418a96ca905c7b7915f6199b87adde9467',
            'x-ibm-client-id': '62384ebd-6575-4fa6-b4ef-b1886c6c7d26-bluemix'
        }
    };

    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var res = JSON.parse(body);
            res.delayedForEach(function (coin) {
                crawlMarketAndUpdateDB(coin);
            }, depositDataInterval * 1000);
        }
    });

};

//TODO erase the DBs before you repopulate otherwise you will have markets that are no longer in use for that coin
