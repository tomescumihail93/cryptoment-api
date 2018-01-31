/**
 * Created by michelcojocaru on 30/01/2018.
 */
const coinMarketCapCoinsCrawler = require('./coinMarketCapGatherHistoricalData.js');
const coinMarketCapMarketsCrawler = require('./coinMarketCapGatherMarkets.js');
const icoWatchListCrawler = require('./icoWatchListGatherData');
const coinCheckUpCrawler = require('./coincheckupGatherData');

/**
 * Consume the api of coinmarketcap and update our historical data with fresh data
 * To be run at 15 min interval !
 */

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

//one day cycle
var fullDBupdateInterval = 24 * 60 * 60/4;// * 1000;
var oneHour = 60 * 60/4;// * 1000;
var quarterHour = oneHour/4;

var noOfIterationsPerDay = new Array(24);

var hourCounter = 1;
var dayCounter = 1;
var waitTime = 0;

setInterval(function(){

    hourCounter = 1;

    //setInterval(function(){
    noOfIterationsPerDay.delayedForEach(function(){

        waitTime = 0;

        console.log('----------------------------');


        //15 min runtime
        //coinMarketCapCoinsCrawler.run();

        if(hourCounter == 2){

            waitTime += quarterHour;
            setTimeout(function(){

                console.log("An quarter has passed: coinMarketCapMarketsCrawler");
                //hourCounter++;
                console.log('----------------------------');
                //15 min runtime
                //coinMarketCapMarketsCrawler.run();
            }, waitTime);//wait 30 minutes before crawling for markets on coinmarketcap

        } else if(hourCounter == 3){

            waitTime += quarterHour;
            setTimeout(function(){

                console.log("An quarter has passed: icoWatchListCrawler");
                //hourCounter++;
                console.log('----------------------------');
                //6 min runtime
                //icoWatchListCrawler.run();
            },waitTime);//wait 60 minutes before crawling for ICOs on icowatchlist

        } else if(hourCounter == 4){

            waitTime += quarterHour;
            setTimeout(function(){

                console.log("An quarter has passed: coinCheckUpCrawler");
                //hourCounter++;
                console.log('----------------------------');
                //35 min runtime
                //coinCheckUpCrawler.run();
            },waitTime);//wait 60 minutes before making prediction, investment, and score updates from coincheckup
        }


        console.log("An hour has passed: " + hourCounter + " coinMarketCapCoinsCrawler");
        ++hourCounter;


    }, oneHour);


    console.log("===============================================================");
    console.log("A day has passed: " + dayCounter);
    console.log("===============================================================");
    dayCounter++;

}, fullDBupdateInterval);

/*
//15 min runtime - 1h interval
setInterval(function(){
    coinMarketCapCoinsCrawler.run();
}, 15 * 60 * 1000);

//15 min runtime - 1 per day
setInterval(function(){
    coinMarketCapMarketsCrawler.run();
}, 24 * 60 * 60 * 1000);

//6 min runtime - 1 per day
setInterval(function(){
    icoWatchListCrawler.run();
}, 24 * 60 * 60 * 1000);

//35 min runtime - 1 per day
setInterval(function(){
    coinCheckUpCrawler.run();
}, 24 * 60 * 60 * 1000);

*/



