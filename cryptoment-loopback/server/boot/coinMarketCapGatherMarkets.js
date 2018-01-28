/**
 * Author: Michel Cojocaru
 * company: Cryptoment
 * */

var cheerio = require('cheerio');
var request = require('request');
var throttledRequest = require('throttled-request')(request);
var waitBeforeNextPageInterval = 120;
var updateDataInterval = 480;//24 * 60 * 60; //once per day
var depositDataInterval = 0.2;//seconds

throttledRequest.configure({
    requests: 1,
    milliseconds: depositDataInterval * 1000
});

//var allMarketsJson = {};


const base_url = 'https://coinmarketcap.com/currencies/';
const end_url = '/#markets';
var marketsJsonList = [];

var limit = 100;

//first digit is "0" for markets from coinmarketcap
var initial_id = 913112091000832;

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

//TODO dereferentiaza intanta de ico ca sa nu ai memory leak

function crawlMarketAndUpdateDB(coin){

    var coinName = coin["name"].toLowerCase();

    request(base_url + coinName + end_url, function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);
            var id = "0" + coin["id"].substring(1);
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

                //console.log(ret.trim());
                if(marketsJson.id != "") {
                    marketsJsonList.push(marketsJson);
                }

            }
            //console.log(marketsJsonList);
            //allMarketsJson[coinName] = marketsJsonList;

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

//Scrape Markets from coinmarketcap based on the name & id in the DB
function run() {
    //setInterval(function() {

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

                //var reserve_id = initial_id;
                var res = JSON.parse(body);

                res.delayedForEach(function (coin) {
                    //reserve_id++;
                    crawlMarketAndUpdateDB(coin);
                }, depositDataInterval * 1000);
            }
        });

    //}, updateDataInterval * 1000);
}

run();