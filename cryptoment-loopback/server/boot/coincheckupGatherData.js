/**
 * Author: Michel Cojocaru
 * company: Cryptoment
 * */

//careful about changing the next two variables standard 3600 & 0.2
const samplingInterval = 1800;//seconds
//const waitAfterDBinit = 30;//seconds
const depositDataInterval = 0.2;//seconds


//const thenRequest = require('request-then');
const request = require('request');
var throttledRequest = require('throttled-request')(request)

throttledRequest.configure({
    requests: 1,
    milliseconds: depositDataInterval * 1000
});

var models = {
    5: 'coin',
    6: 'investment',
    7: 'prediction',
    8: 'score'

};

//if this is false supply only updates if it has a new value different from null
const keepDuplicateData = false;


//toggler for database initital population process (beware it overwrites all data in db)
var isDbPopulated = false;

//first digit is "5" , "6" , "7" , "8" for coincheckup coin, investment, prediction, score model in this order.
var initial_id = 913112091000832;

//investment entity
class Investment{

    constructor(
        id,
        firstPriceUsd,
        cmgr,
        growthAllTime,
        averageMarketCap1m,
        averageVolume1m,
        coinAge,
        winningMonths12m,
        averageMothlyRoi1y,
        dailyPrice7d,
        historical200d,
        historical90d,
        historical45d,
        historical30d,
        historical14d,
        volatility30d,
        volatility1w
    ){
        this.id = id;
        this.firstPriceUsd = firstPriceUsd;
        this.cmgr = cmgr;
        this.growthAllTime = growthAllTime;
        this.averageMarketCap1m = averageMarketCap1m;
        this.averageVolume1m = averageVolume1m;
        this.coinAge = coinAge;
        this.winningMonths12m = winningMonths12m;
        this.averageMothlyRoi1y = averageMothlyRoi1y;
        this.dailyPrice7d = dailyPrice7d;
        this.historical200d = historical200d;
        this.historical90d = historical90d;
        this.historical45d = historical45d;
        this.historical30d = historical30d;
        this.historical14d = historical14d;
        this.volatility30d = volatility30d;
        this.volatility1w = volatility1w;
    }
}

//prediction entity
class Prediction{

    constructor(
        id,
        growthBtc,
        growthOthers,
        worldMoney
    ){
        this.id = id;
        this.growthBtc = growthBtc;
        this.growthOthers = growthOthers;
        this.worldMoney = worldMoney;
    }
}

class Score{

    constructor(
        id,
        totalScore,
        teamScore,
        advisorsScore,
        communityScore,
        productScore,
        coinScore,
        socialMediaScore,
        communicationScore,
        businessScore,
        githubScore
    ){
        this.id = id;
        this.totalScore = totalScore;
        this.teamScore = teamScore;
        this.advisorsScore = advisorsScore;
        this.communityScore = communityScore;
        this.productScore = productScore;
        this.coinScore = coinScore;
        this.socialMediaScore = socialMediaScore;
        this.communicationScore = communicationScore;
        this.businessScore = businessScore;
        this.githubScore = githubScore;
    }
}

//coin entity
class Coin{

    constructor(
        _id,
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
        lastUpdated,
        proofType
    ){

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

        this.proofType = proofType;



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

    //requestFromDB();
    //setInterval(requestFromDB, samplingInterval * 1000);//

}

function requestFromDB(){

    var options = {
        method: 'GET',
        url: 'https://cryptoment-api.mybluemix.net/api/coincheckup_coin_models',
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

function setOptions(coin, key ,reserve_id){

    var var_id = parseInt(key.toString() + reserve_id.toString());

    var options = {
        method: 'PUT',
        url: 'https://cryptoment-api.mybluemix.net/api/coincheckup_' + models[key] + '_models',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'x-ibm-client-secret': 'e399a9e4ba39d2941cb14875f7545e418a96ca905c7b7915f6199b87adde9467',
            'x-ibm-client-id': '62384ebd-6575-4fa6-b4ef-b1886c6c7d26-bluemix'
        },
        json: true
    };

    if(key == 5){
        options.body = {
            id: var_id.toString(),
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
            proofType: coin["market"] != null ? coin["market"]["proof_type"] : "",
            rank: coin["rank"],
            symbol: coin["symbol"],
            totalSupply: [coin["total_supply"]],
            volume24h: [coin["24h_volume_usd"]]
        }
    }else if(key == 6){
        options.body = {
            id: var_id.toString(),
            name: coin["name"],
            rank: coin["rank"],
            symbol: coin["symbol"],
            averageMarketCap1m: coin["investment"] != null ? coin["investment"]["average_mktcap_1m"] : "",
            averageMothlyRoi1y: coin["investment"] != null ? coin["investment"]["average_monthly_roi_1y"] : "",
            averageVolume1m: coin["investment"] != null ? coin["investment"]["average_volume_1m"] : "",
            cmgr: coin["investment"] != null ? coin["investment"]["cmgr"] : "",
            coinAge: coin["investment"] != null ? coin["investment"]["coin_age"] : "",
            dailyPrice7d: coin["investment"] != null ? coin["investment"]["daily_price_7d"] : "",
            firstPriceUsd: coin["investment"] != null ? coin["investment"]["first_price_usd"] : "",
            growthAllTime: coin["investment"] != null ? coin["investment"]["growth_all_time"] : "",
            winningMonths12m: coin["investment"] != null ? coin["investment"]["winning_months_trailing_12m"] : "",
            historical14d: coin["investment"]["historicals"] != null ? coin["investment"]["historicals"]["14d"] : "",
            historical200d: coin["investment"]["historicals"] != null ? coin["investment"]["historicals"]["200d"] : "",
            historical30d: coin["investment"]["historicals"] != null ? coin["investment"]["historicals"]["30d"] : "",
            historical45d: coin["investment"]["historicals"] != null ? coin["investment"]["historicals"]["45d"] : "",
            historical90d: coin["investment"]["historicals"] != null ? coin["investment"]["historicals"]["90"] : "",
            volatility1w: coin["volatility_1w"],
            volatility30d: coin["volatility_30d"]

        }
    }else if(key == 7){
        options.body = {
            id: var_id.toString(),
            name: coin["name"],
            rank: coin["rank"],
            symbol: coin["symbol"],
            growthBtc: coin["predictions"] != null ? coin["predictions"]["growth_btc"] : "",
            growthOthers: coin["predictions"] != null ? coin["predictions"]["growth_others"] : "",
            worldMoney: coin["predictions"] != null ? coin["predictions"]["worldMoney"] : ""
        }
    }else if(key == 8){
        options.body = {
            id: var_id.toString(),
            name: coin["name"],
            rank: coin["rank"],
            symbol: coin["symbol"],
            advisorsScore: coin["scores"] != null ? coin["scores"]["D"] : "",//
            businessScore: coin["scores"] != null ? coin["scores"]["H"] : "",//
            coinScore: coin["scores"] != null ? coin["scores"]["G"] : "",//
            communicationScore: coin["scores"] != null ? coin["scores"]["A"] : "",//
            communityScore: coin["scores"] != null ? coin["scores"]["E"] : "",//
            githubScore: coin["scores"] != null ? coin["scores"]["J"] : "",//
            productScore: coin["scores"] != null ? coin["scores"]["F"] : "",//
            socialMediaScore: coin["scores"]!= null ? coin["scores"]["B"] : "",//
            teamScore: coin["scores"] != null ? coin["scores"]["C"] : "",//
            totalScore: coin["score"] != null ? coin["score"]: ""//
        }
    }

    return options
}

var initializeDB = function() {

    request("https://coincheckup.com/data/prod/201801261131/coins.json", function (error, response, body) {

        if (!error && response.statusCode == 200) {

            var reserve_id = initial_id;

            var res = JSON.parse(body);

            res.delayedForEach(function (coin) {

                reserve_id++;

                Object.keys(models).delayedForEach(function (key/*, indexKeys, arrayKeys*/) {

                    var options = setOptions(coin, key , reserve_id);

                    throttledRequest(options, function (error, response, body) {
                        if (error){
                            console.error('Failed: %s', error.message);
                        }
                        console.log('Success:\n', body);
                    });

                }, depositDataInterval * 1000);

            }, 4.5 * depositDataInterval * 1000);
        }

    });

    //isDbPopulated = true;
    //console.log("DB fully populated.");

};

function mergeHistoricalWithCurrent(oldData, currentData, keepNulls){

/*
    console.log("------------------------------------");
    console.log("oldData: " + oldData);
    console.log("JSON.parse(oldData): " + JSON.parse(oldData));
    console.log("typeof(oldData): " + typeof(oldData));

    console.log("currentData: " + currentData);
    console.log("typeof(currentData): " + typeof(currentData));
    console.log("------------------------------------");
*/

    var list = oldData;

    if(oldData == null || oldData == undefined){
        list = [];
    }

    if(typeof(oldData) == "string"){
        list = [];
        list.push(oldData.toString());
    } else if (typeof(oldData) == "object"){

        if (JSON.parse(oldData) instanceof Array) {
            list = JSON.parse(oldData);
        }else{
            list = [];
            list.push(oldData.toString());//TODO check this
        }
    }

    if(keepNulls){
        list.push(currentData);
    } else {
        if(String(currentData) != "null" && list.length > 0 && String(currentData) != String(list[list.length-1])){
            list.push(currentData);
        }else{
            //do nothing
        }
    }

    return JSON.stringify(list);
}

var mergeAndSend = function(coinList) {

    //update historical data with fresh data
    request("https://coincheckup.com/data/prod/201801261131/coins.json", function (error, response, body) {
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
                        //coinHistory.id = freshCoin["id"];
                        //coinHistory.id = coinHistory.id;
                        coinHistory.name = freshCoin["name"];
                        coinHistory.percentChange1h = freshCoin["percent_change_1h"];
                        coinHistory.percentChange24h = freshCoin["percent_change_24h"];
                        coinHistory.percentChange7d = freshCoin["percent_change_7d"];
                        coinHistory.rank = freshCoin["rank"];
                        coinHistory.symbol = freshCoin["symbol"];
                        coinHistory.proofType = freshCoin["market"] != null ? freshCoin["market"]["proof_type"] : "";

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
                            url: 'https://cryptoment-api.mybluemix.net/api/coincheckup_coin_models',
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
                                "proofType": coinHistory.proofType,
                                "totalSupply": coinHistory.totalSupply,
                                "volume24h": coinHistory.volume24h
                            },
                            json: true
                        };

                        throttledRequest(options, function (error, response, body) {
                            if (error) return console.error('Failed: %s', error.message);
                            console.log('Success: ', body);
                        });
                    }

                }, depositDataInterval * 1000);

            }

        });

};


run();

