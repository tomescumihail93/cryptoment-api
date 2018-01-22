/**
 * Author: Michel Cojocaru
 * company: Cryptoment
 * */

const request = require('request');
const fs = require('fs');

//careful about changing the next two variables standard 300 & 0.15
const samplingInterval = 300;//seconds
const depositDataInterval = 0.15;//seconds
const noLimit = "0";
const limit100 = "100";

var noOfCalls = 0;
//list of all coins from coinmarketcap.com
var coinList = [];

//toggler for database initital population process
var wasLoadedIntoDB = false;
var initial_id = 1913112091000832;
//coin entity
class Coin{

/*
  private _id: string;
  private name: string;
  private symbol: string;
  private rank: string;
  private priceUSD: [string];
  private priceBTC: [string];
  private volume24h: [string];
  private marketCapUSD: [string];
  private availableSupply: [string];
  private totalSupply: [string];
  private maxSupply: [string];
  private percentChange1h: string;
  private percentChange24h: string;
  private percentChange7d: string;
  private lastUpdated: string;
*/
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
      this.priceUSD.push(price);
  }

  pushToPriceBTCList(price){
      this.priceBTC.push(price);
  }

  pushToMarketCapList(cap){
      this.marketCapUSD.push(cap);
  }

  pushToVolume24hList(volume){
      this.volume24h.push(volume);
  }

  pushToAvailableSupplyList(supply){
      if(this.availableSupply[this.availableSupply.length - 1] != supply) {
          this.availableSupply.push(supply);
      }
  }

  pushToTotalSupplyList(supply){
      if(this.totalSupply[this.totalSupply.length - 1] != supply){
          this.totalSupply.push(supply);
      }
  }

  pushToMaxSupplyList(supply){
      if(this.maxSupply[this.maxSupply.length - 1] != supply) {
          this.maxSupply.push(supply);
      }
  }

  pushToLastUpdatedList(timestamp){
      this.lastUpdated.push(timestamp);
  }

}

function getCoinById(id){
    var ret_coin = null;
    coinList.forEach(function(coin){
    if(coin.id == id){
          ret_coin = coin;
      }
    });
    return ret_coin;
}

function getCoinBySymbol(symbol){
    var ret_coin = null;
    coinList.forEach(function(coin){
        if(coin.symbol == symbol){
            ret_coin = coin;
        }
    });
    return ret_coin;
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

request("https://api.coinmarketcap.com/v1/ticker/?limit=" + noLimit, function (error, response, body) {
    if(!error && response.statusCode == 200) {

        var res = JSON.parse(body);
        //console.log(res)
        res.delayedForEach(function (coin) {

            initial_id++;

            coinList.push(new Coin(
                initial_id.toString(),
                coin["id"],
                coin["name"],
                coin["symbol"],
                coin["rank"],
                coin["price_usd"],
                coin["price_btc"],
                coin["24h_volume_usd"],
                coin["market_cap_usd"],
                coin["available_supply"],
                coin["total_supply"],
                coin["max_supply"],
                coin["percent_change_1h"],
                coin["percent_change_24h"],
                coin["percent_change_7d"],
                coin["last_updated"]
            ));



            var options = {
                method: 'POST',
                url: 'https://cryptoment-api.mybluemix.net/api/coinmarketcap_coin_models',
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    'x-ibm-client-secret': 'e399a9e4ba39d2941cb14875f7545e418a96ca905c7b7915f6199b87adde9467',
                    'x-ibm-client-id': '62384ebd-6575-4fa6-b4ef-b1886c6c7d26-bluemix'
                },
                body: {
                    _id: initial_id.toString(),
                    id: coin["id"],
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
                console.log('Success: ', body);
            });

        }, depositDataInterval * 1000);
    }
    wasLoadedIntoDB = true;
});

//busy waiting for the initialization of the db
//while(!wasLoadedIntoDB){}

//make a poll for new data every 5 min
var timerRequestDataFromCoinMarketCap = setInterval(function () {

    //update historical data with fresh data
    request("https://api.coinmarketcap.com/v1/ticker/?limit=" + noLimit, function (error, response, body) {

        if (!error && response.statusCode == 200) {
            var res = JSON.parse(body);

            res.delayedForEach(function (coin) {
                //retrieve coin from local copy
                var coinHistory = getCoinBySymbol(coin["symbol"]);

                if (coinHistory != null) {
                    //add rest of fields
                    coinHistory.name = coin["name"];
                    coinHistory.percentChange1h = coin["percent_change_1h"];
                    coinHistory.percentChange24h = coin["percent_change_24h"];
                    coinHistory.percentChange7d = coin["percent_change_7d"];
                    coinHistory.rank = coin["rank"];
                    coinHistory.pushToPriceUSDList(coin["price_usd"]);
                    coinHistory.pushToPriceBTCList(coin["price_btc"]);
                    coinHistory.pushToMarketCapList(coin["market_cap_usd"]);
                    coinHistory.pushToVolume24hList(coin["24h_volume_usd"]);
                    coinHistory.pushToAvailableSupplyList(coin["available_supply"]);
                    coinHistory.pushToTotalSupplyList(coin["total_supply"]);
                    coinHistory.pushToLastUpdatedList(coin["last_updated"]);
                    coinHistory.pushToMaxSupplyList(coin["max_supply"]);
                }

                //update data to remote db
                var options = { method: 'PUT',
                    url: 'https://cryptoment-api.mybluemix.net/api/coinmarketcap_coin_models',
                    headers: {
                        accept: 'application/json',
                        'content-type': 'application/json',
                        'x-ibm-client-secret': 'e399a9e4ba39d2941cb14875f7545e418a96ca905c7b7915f6199b87adde9467',
                        'x-ibm-client-id': '62384ebd-6575-4fa6-b4ef-b1886c6c7d26-bluemix'
                    },
                    body: {
                        _id: coinHistory["_id"],
                        id: coinHistory["id"],
                        availableSupply: coinHistory["availableSupply"],
                        lastUpdated: coinHistory["lastUpdated"],
                        marketCapUSD: coinHistory["marketCapUSD"],
                        maxSupply: coinHistory["maxSupply"],
                        name: coinHistory["name"],
                        percentChange1h: coinHistory["percentChange1h"],
                        percentChange24h: coinHistory["percentChange24h"],
                        percentChange7d: coinHistory["percentChange7d"],
                        priceBTC: coinHistory["priceBTC"],
                        priceUSD: coinHistory["priceUSD"],
                        rank: coinHistory["rank"],
                        symbol: coinHistory["symbol"],
                        totalSupply: coinHistory["totalSupply"],
                        volume24h: coinHistory["volume24h"]
                    },
                    json: true
                };

                request(options, function (error, response, body) {

                    if (error) return console.error('Failed: %s', error.message);
                    console.log('Success: ', body);
                });

            }, depositDataInterval * 1000);

        }

    });
}, samplingInterval * 1000);







