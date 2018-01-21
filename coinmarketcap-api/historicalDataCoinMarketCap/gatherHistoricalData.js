const request = require('request');
const fs = require('fs');
const samplingInterval = 5 * 60;//seconds
var noOfCalls = 0;
//list of all coins from coinmarketcap.com
var coinList = [];

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

  pushToLastUpdatedList(timestamp){
      this.lastUpdated.push(timestamp);
  }

}

function getCoinById(id){
    var ret_coin = null;
    coinList.forEach(function(coin){
    if(coin._id == id){
          ret_coin = coin;
      }
    });
    return ret_coin;
}
/*
var historicalDataPriceUSD = [];
var historicalDataPriceBTC = [];
var historicalData24hVolume = [];
var historicalDataMarketCapUSD = [];
*/

var historicalData;
fs.readFile('./historicalDataCoinMarketCap/inputHistoricalCoinMarketCapData.txt', 'utf8', function (err, data) {
  if (err) throw err;

  historicalData = JSON.parse(data);
  historicalData.forEach(function(coin){

        coinList.push(new Coin(
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
    });

    //populate the initial list of coins
    coinList.forEach(function(coin) {
        fs.appendFile('./historicalDataCoinMarketCap/outputHistoricalCoinMarketCapData.txt', JSON.stringify(coin,null,2) + ",", (err) => {
            if (err) throw err;
            //console.log('The file has been saved!');
        });
    });
    //make a poll for new data every 60sec
    var timerID = setInterval(function() {
        //update historical data with fresh data
        request('https://api.coinmarketcap.com/v1/ticker/', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var info = JSON.parse(body);
                info.forEach(function(coin){
                    //console.log(coin["id"]);
                    var coinHistory = getCoinById(coin["id"]);
                    //console.log(coinHistory);
                    if(coinHistory != null) {
                        //console.log("MATCH =====" );
                        coinHistory.pushToPriceUSDList(coin["price_usd"]);
                        coinHistory.pushToPriceBTCList(coin["price_btc"]);
                        coinHistory.pushToMarketCapList(coin["market_cap_usd"]);
                        coinHistory.pushToVolume24hList(coin["24h_volume_usd"]);
                        coinHistory.pushToAvailableSupplyList(coin["available_supply"]);
                        coinHistory.pushToTotalSupplyList(coin["total_supply"]);
                        coinHistory.pushToLastUpdatedList(coin["last_updated"]);
                    }
                });

                fs.writeFile("./historicalDataCoinMarketCap/finalHistoricalCoinMarketCapData.json", JSON.stringify(coinList,null,2), function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    noOfCalls++;
                    console.log("Call " + noOfCalls + " was successful!");
                });

            }
        });
    }, samplingInterval * 1000);
});

//clearInterval(timerID);





