/**
 * Author: Michel Cojocaru
 * company: Cryptoment
 * */

//careful about changing the next two variables standard 3600 & 0.15
const samplingInterval = 3600;//seconds
//const waitAfterDBinit = 30;//seconds
const depositDataInterval = 0.2;//seconds


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

if(hasLimit){
    var limit = "100";
}else{
    var limit =  "0";
}


var noOfCalls = 0;

//list of all coins from coinmarketcap.com
var coinList = [];

//toggler for database initital population process (beware it overwrites all data in db)
var isDbPopulated = true;

//first digit is "1" for coinmarketcap coin model
var initial_id = 1913112091000832;

//coin entity
class Coin{

    constructor(_id,
                id,
                name,
                symbol,
                rank,
                priceUSD,
                priceBTC,
                volume24h,
                marketCapUSD,
                availableSupply,
                totalSupply,
                maxSupply,
                percentChange1h,
                percentChange24h,
                percentChange7d,
                lastUpdated){

        this._id = _id;
        this.id = id;
        this.name = name;
        this.symbol = symbol;
        this.rank = rank;
        this.priceUSD = [];
        this.priceUSD.push(priceUSD);
        this.priceBTC = [];
        this.priceBTC.push(priceBTC);
        this.volume24h = [];
        this.volume24h.push(volume24h);
        this.marketCapUSD = [];
        this.marketCapUSD.push(marketCapUSD);
        this.availableSupply = [];
        this.availableSupply.push(availableSupply);
        this.totalSupply = [];
        this.totalSupply.push(totalSupply);
        this.maxSupply = [];
        this.maxSupply.push(maxSupply);
        this.percentChange1h = percentChange1h;
        this.percentChange24h = percentChange24h;
        this.percentChange7d = percentChange7d;
        this.lastUpdated = [];
        this.lastUpdated.push(lastUpdated);


    }

    pushToPriceUSDList(price){
        if(price != null) {
            this.priceUSD.push(price);
        }
    }

    pushToPriceBTCList(price){
        if(price != null) {
            this.priceBTC.push(price);
        }
    }

    pushToMarketCapList(cap){
        if(cap != null) {
            this.marketCapUSD.push(cap);
        }
    }

    pushToVolume24hList(volume){
        if(volume != null) {
            this.volume24h.push(volume);
        }
    }

    pushToAvailableSupplyList(supply){
        if(supply != null) {
            if (this.availableSupply[this.availableSupply.length - 1] != supply) {
                this.availableSupply.push(supply);
            }
        }
    }

    pushToTotalSupplyList(supply){
        if(supply != null) {
            if (this.totalSupply[this.totalSupply.length - 1] != supply) {
                this.totalSupply.push(supply);
            }
        }
    }

    pushToMaxSupplyList(supply){
        if(supply != null) {
            if (this.maxSupply[this.maxSupply.length - 1] != supply) {
                this.maxSupply.push(supply);
            }
        }
    }

    pushToLastUpdatedList(timestamp){
        this.lastUpdated.push(timestamp);
    }

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

function getCoinBySymbol(symbol,coinList){
    var ret_coin = null;

    coinList.forEach(function(coin){
        if(coin.symbol == symbol){
            ret_coin = coin;
        }
    });

    return ret_coin;
}

function run() {

    if (!isDbPopulated) {
        initializeDB();
    }

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

    setTimeout(function(){
        request(options, function (error, response, body) {
            if (error) return console.error('Failed: %s', error.message);
            //console.log('Success: ', body);

            var remoteCoinList = JSON.parse(body);

            mergeAndSend(remoteCoinList);
        });
    }, samplingInterval * 1000);//
}

var initializeDB = function() {
    request("https://api.coinmarketcap.com/v1/ticker/?limit=" + limit, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            var reserve_id = initial_id;

            var res = JSON.parse(body);
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
                        _id: reserve_id.toString(),
                        id: reserve_id.toString(),
                        availableSupply: [coin["available_supply"]],
                        lastUpdated: [coin["last_updated"]],
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
                    //console.log('Success: ', body);
                });

            }, depositDataInterval * 1000);
        }
        isDbPopulated = true;
        //console.log("DB fully populated.");
    });
};

function mergeHistoricalWithCurrent(oldData,currentData,keepNulls){

    var list = oldData;

    if(oldData == null){
        list = [];
    }

    if(typeof(oldData) == "string"){
        list = JSON.parse(oldData);
    }

    if(keepNulls){
        list.push(currentData);
    } else {

        if(String(currentData) != "null" && String(currentData) != String(list[list.length-1])){
            list.push(currentData);
        }
    }

    return JSON.stringify(list);
}

var mergeAndSend = function(coinList) {

    //make a poll for new data
    setInterval(function () {
        //update historical data with fresh data
        request("https://api.coinmarketcap.com/v1/ticker/?limit=" + limit, function (error, response, body) {

            if (!error && response.statusCode == 200) {
                var res = JSON.parse(body);

                res.forEach(function (freshCoin) {

                    var coinHistory = null;
                    for (var i = 0; i < coinList.length ; i++){

                        if(String(coinList[i]["symbol"]) == freshCoin["symbol"]){
                            coinHistory = coinList[i];
                            break;
                        }

                    }

                    //retrieve coin from local copy

                    if (coinHistory != null && coinHistory != undefined) {

                        //coinHistory.id = freshCoin["id"];
                        coinHistory._id = coinHistory.id;
                        coinHistory.name = freshCoin["name"];
                        coinHistory.percentChange1h = freshCoin["percent_change_1h"];
                        coinHistory.percentChange24h = freshCoin["percent_change_24h"];
                        coinHistory.percentChange7d = freshCoin["percent_change_7d"];
                        coinHistory.rank = freshCoin["rank"];
                        coinHistory.symbol = freshCoin["symbol"];

                        coinHistory.priceUSD = mergeHistoricalWithCurrent(coinHistory["priceUSD"],freshCoin["price_usd"],true);
                        coinHistory.priceBTC = mergeHistoricalWithCurrent(coinHistory["priceBTC"],freshCoin["price_btc"],true);
                        coinHistory.lastUpdated = mergeHistoricalWithCurrent(coinHistory["lastUpdated"],freshCoin["last_updated"],true);
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
                                "_id": coinHistory._id,
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

                        throttledRequest(options, function (error, response, body) {

                            if (error) return console.error('Failed: %s', error.message);
                            //console.log('Success: ', body);
                        });
                    }

                });//, depositDataInterval * 1000);

            }

        });
    }, samplingInterval * 1000);

};


//run();

