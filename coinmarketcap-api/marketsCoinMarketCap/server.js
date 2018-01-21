/**
 * Created by michelcojocaru on 20/01/2018.
 */

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');


var coinNamesList = ["ripple","bitcoin","ethereum"];

var allMarketsJson = {};
var allMarketsJsonList = [];

coinNamesList.forEach(function(coinName){
    allMarketsJson[coinName] = "";
});
console.log(allMarketsJson);

const base_url = 'https://coinmarketcap.com/currencies/';
const end_url = '/#markets';
var marketsJsonList = [];


coinNamesList.forEach(function(coinName){

    request(base_url + coinName + end_url, function(error, response, html){
        if(!error){
            var $ = cheerio.load(html);
            //console.log(html);
            var id, exchange, pair, volume24h, price, volume;
            var json = { id : "", exchange : "", pair : "", volume24h : "", price : "", volume : ""};
            var rows = $('#markets-table').find('tr');
            for(var i = 0; i < rows.length; i++){
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
                marketsJson.volume24h = $(current).children("td:nth-child(4)").text().replace(/(\r\n|\n|\r|\*|\**)/gm,"").trim();
                marketsJson.price = $(current).children("td:nth-child(5)").text().replace(/(\r\n|\n|\r|\*|\**)/gm,"").trim();
                marketsJson.volume = $(current).children("td:nth-child(6)").text();

                //console.log(ret.trim());
                if(marketsJson.id != "") {
                    marketsJsonList.push(marketsJson);
                }


            }
            console.log(marketsJsonList);
            allMarketsJson[coinName] = marketsJsonList;
            marketsJsonList = [];

        }

        fs.writeFile('availableMarketsCoinMarketCap.json', JSON.stringify(allMarketsJson, null, 2), function(err){
            //console.log('File successfully written! - Check your project directory for the output.json file');
        });

    }) ;


});



