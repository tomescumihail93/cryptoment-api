/**
 * Author: Michel Cojocaru
 * company: Cryptoment
 * */

/**
 * Population duration 15 min
 * Update duration 15 min
 * Write interval 0.5 sec
   */

//careful about changing the next two variables standard 3600 & 0.15
const samplingInterval = 900;//seconds
//const waitAfterDBinit = 30;//seconds
const depositDataInterval = 0.5;//seconds


//const thenRequest = require('request-then');
const request = require('request');
var throttledRequest = require('throttled-request')(request)

throttledRequest.configure({
    requests: 1,
    milliseconds: depositDataInterval * 1000
});


//base url + limit to control the flux from coinmarketcap
const hasLimit = false;

//if this is false supply only updates if it has a new value different from null
const keepDuplicateData = false;

//toggler for database initital population process (beware it overwrites all data in db)
var isDbPopulated = true;

//date object to be used for current time acquisition
var date = new Date();

var initial_id = 1913112091000832;

var limit = "0";

if(hasLimit){
    limit = "100";
}



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

function updateDB(){

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
        if (error) return console.error('Failed: %s', error.message);
        //console.log('Success: ', body);

        var remoteCoinList = JSON.parse(body);

        mergeAndSend(remoteCoinList);
    });
}



var initializeDB = function() {
    request("https://api.coinmarketcap.com/v1/ticker/?limit=" + limit, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var reserve_id = initial_id;
            var res = JSON.parse(body);

            date = new Date();
            res.delayedForEach(function (coin) {
                reserve_id++;

                var options = {
                    method: 'PUT',
                    url: 'https://cryptoment-api.mybluemix.net/api/coinmarketcap_coin_models',
                    headers: {
                        accept: 'application/json',
                        'content-type': 'application/json',
                        'x-ibm-client-secret': 'e399a9e4ba39d2941cb14875f7545e418a96ca905c7b7915f6199b87adde9467',
                        'x-ibm-client-id': '62384ebd-6575-4fa6-b4ef-b1886c6c7d26-bluemix'
                    },
                    body: {
                        id: reserve_id.toString(),
                        availableSupply: [coin["available_supply"]],
                        lastUpdated: [date.getTime().toString()],
                        marketCapUSD: [coin["market_cap_usd"]],
                        maxSupply: [coin["max_supply"]],
                        name: coin["name"],
                        percentChange1h: coin["percent_change_1h"],
                        percentChange24h: coin["percent_change_24h"],
                        percentChange7d: coin["percent_change_7d"],
                        priceBTC: [coin["price_btc"]],
                        priceUSD: [coin["price_usd"]],
                        rank: coin["rank"],
                        symbol: coin["symbol"],
                        totalSupply: [coin["total_supply"]],
                        volume24h: [coin["24h_volume_usd"]]
                    },
                    json: true
                };

                request(options, function (error, response, body) {
                    if (error) return console.error('Failed: %s', error.message);
                    console.log('Success: ', body);
                });

            }, depositDataInterval * 1000);
        }
        isDbPopulated = true;
        //console.log("DB fully populated.");
    });
};

function mergeHistoricalWithCurrent(oldData,currentData,keepNulls){
    var list = oldData;
    if (oldData == null) {
        list = [];
    }
    if (typeof(oldData) == "string") {
        list = JSON.parse(oldData);
    }
    if (keepNulls) {
        list.push(currentData);
    } else {
        if (String(currentData) != "null" && String(currentData) != String(list[list.length-1])) {
            list.push(currentData);
        }
    }
    return JSON.stringify(list);
}

var mergeAndSend = function(coinList) {
    //update historical data with fresh data
    request("https://api.coinmarketcap.com/v1/ticker/?limit=" + limit, function (error, response, body) {
         if (!error && response.statusCode == 200) {
            var res = JSON.parse(body);

            res.delayedForEach(function (freshCoin) {

                var coinHistory = null;
                for (var i = 0; i < coinList.length ; i++){
                    if(String(coinList[i]["symbol"]) == freshCoin["symbol"]){
                        coinHistory = coinList[i];
                        break;
                    }
                }
                //retrieve coin from local copy
                if (coinHistory != null && coinHistory != undefined) {
                    coinHistory.name = freshCoin["name"];
                    coinHistory.percentChange1h = freshCoin["percent_change_1h"];
                    coinHistory.percentChange24h = freshCoin["percent_change_24h"];
                    coinHistory.percentChange7d = freshCoin["percent_change_7d"];
                    coinHistory.rank = freshCoin["rank"];
                    coinHistory.symbol = freshCoin["symbol"];

                    coinHistory.priceUSD = mergeHistoricalWithCurrent(coinHistory["priceUSD"],freshCoin["price_usd"],true);
                    coinHistory.priceBTC = mergeHistoricalWithCurrent(coinHistory["priceBTC"],freshCoin["price_btc"],true);
                    coinHistory.lastUpdated = mergeHistoricalWithCurrent(coinHistory["lastUpdated"],date.getTime().toString(),true);
                    coinHistory.marketCapUSD = mergeHistoricalWithCurrent(coinHistory["marketCapUSD"],freshCoin["market_cap_usd"],true);
                    coinHistory.volume24h = mergeHistoricalWithCurrent(coinHistory["volume24h"],freshCoin["24h_volume_usd"],true);
                    coinHistory.maxSupply = mergeHistoricalWithCurrent(coinHistory["maxSupply"],freshCoin["max_supply"],keepDuplicateData);//keepDuplicateData
                    coinHistory.availableSupply = mergeHistoricalWithCurrent(coinHistory["availableSupply"],freshCoin["available_supply"],keepDuplicateData);
                    coinHistory.totalSupply = mergeHistoricalWithCurrent(coinHistory["totalSupply"],freshCoin["total_supply"],keepDuplicateData);

                    //update data to remote db
                    var options = {
                        method: 'PUT',
                        url: 'https://cryptoment-api.mybluemix.net/api/coinmarketcap_coin_models',
                        headers: {
                            accept: 'application/json',
                            'content-type': 'application/json',
                            'x-ibm-client-secret': 'e399a9e4ba39d2941cb14875f7545e418a96ca905c7b7915f6199b87adde9467',
                            'x-ibm-client-id': '62384ebd-6575-4fa6-b4ef-b1886c6c7d26-bluemix'
                        },
                        body: {
                            "id": coinHistory.id,
                            "availableSupply": coinHistory.availableSupply,
                            "lastUpdated": coinHistory.lastUpdated,
                            "marketCapUSD": coinHistory.marketCapUSD,
                            "maxSupply": coinHistory.maxSupply,
                            "name": coinHistory.name,
                            "percentChange1h": coinHistory.percentChange1h,
                            "percentChange24h": coinHistory.percentChange24h,
                            "percentChange7d": coinHistory.percentChange7d,
                            "priceBTC": coinHistory.priceBTC,
                            "priceUSD": coinHistory.priceUSD,
                            "rank": coinHistory.rank,
                            "symbol": coinHistory.symbol,
                            "totalSupply": coinHistory.totalSupply,
                            "volume24h": coinHistory.volume24h
                        },
                        json: true
                    };

                    request(options, function (error, response, body) {
                        if (error) {
                            return console.error('Failed: %s', error.message);
                        }
                        console.log('Success: ', body);
                    });
                }

            }, depositDataInterval * 1000);

        }

    });

};


//run();

exports.run = function run() {

    if (!isDbPopulated) {
        initializeDB();
    } else {
        updateDB();
    }
/*
    setInterval(function(){
        updateDB();
    }, samplingInterval * 1000);//
    */
};