/**
 * Author: Mihail Tomescu & Michel Cojocaru
 * company: Cryptoment
 * */

var cheerio = require("cheerio");
var request = require('request')
var throttledRequest = require('throttled-request')(request)
var updateDataInterval = 60;//24 * 60 * 60; //once per day
var depositDataInterval = 0.15;//seconds

throttledRequest.configure({
    requests: 1,
    milliseconds: depositDataInterval * 1000
});

//var helpers = require('./helpers/helpers');

//var EventEmitter = require("events").EventEmitter;
//var body = new EventEmitter();


var icoList = [
    'https://icowatchlist.com/live',
    'https://icowatchlist.com/upcoming',
    'https://icowatchlist.com/finished'
];

//var liveIcosList = [];

//first digit is "2" for icowatchlist live ico model
var initial_id = 2913112091000832;

class liveIco{

    constructor(){

        this.id = "";
        this.name = "";
        this.market = "";
        this.endsOn = "";
        this.startsOn = "";
        this.homePage = "";
        this.platform = "";
        this.progress = "";
        this.country = "";
        this.whitePaper = "";
        this.founders = [""];
        this.channels = [""];
        this.logo = "";

    }

    setName(name){
        this.name = name;
    }

    setId(id){
        this.id = id;
    }

    setMarket(market){
        this.market = market;
    }

    setEndsOn(endsOn){
        this.endsOn = endsOn;
    }

    setStartsOn(startsOn){
        this.startsOn = startsOn;
    }

    setHomePage(homePage){
        this.homePage = homePage;
    }

    setPlatform(platform){
        this.platform = platform;
    }

    setProgress(progress){
        this.progress = progress;
    }

    setCountry(country){
        this.country = country;
    }

    setWhitePaper(whitePaper){
        this.whitePaper = whitePaper;
    }

    setFounders(founders){
        this.founders = founders;
    }

    setChannels(channels){
        this.channels = channels;
    }

    setLogo(logo){
        this.logo = logo;
    }
}

//busy waiting
function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
}



var initial_rank = 1;
var ico = [];
//Scrape live ICO's
setInterval(function() {
    request(icoList[0], function (error, response, html) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
            var id = initial_id;
            //var rank = initial_rank;



                $('table.main-ico-table tr').each(function (i, elem) {


                    var liveIcoInstance = new liveIco();
                    liveIcoInstance.setId(String(id++));

                    //liveIcoModel["rank"] = String(rank++);

                    liveIcoInstance.setMarket($(this).find("td div.row div a p span").text());

                    var icoPath = $(this).find("td div.row div a").attr('href'); // --> example output: "ico/eos"

                    if (icoPath) {
                        request('https://icowatchlist.com/' + icoPath, function (error, response, html) {
                            var $ = cheerio.load(html);

                            $('table.main-ico-table tr').each(function (i, elem) {

                                var icoNameString = $(this).find("td div > img").attr('alt'); // --> MATRIX ICO Logo
                                if (icoNameString) {
                                    liveIcoInstance.setName(icoNameString.substring(0, icoNameString.indexOf(' ICO')));
                                }

                                if ($(this).find("td:nth-child(1)").text() == "Founders") {
                                    liveIcoInstance.setFounders($(this).find("td:nth-child(2)").text().split(', '));
                                }

                                if ($(this).find("td:nth-child(1)").text() == "ICO Start") {
                                    liveIcoInstance.setStartsOn($(this).find("td:nth-child(2)").text());
                                } else if ($(this).find("td:nth-child(1)").text() == "ICO End") {
                                    liveIcoInstance.setEndsOn($(this).find("td:nth-child(2)").text());
                                }

                                if ($(this).find("td:nth-child(1)").text() == "Progress") {
                                    liveIcoInstance.setProgress($(this).find("td:nth-child(2)").text().trim().replace("%", ""));
                                }

                                if ($(this).find("td:nth-child(1)").text() == "Platform") {
                                    liveIcoInstance.setPlatform($(this).find("td:nth-child(2)").text());
                                }

                                if ($(this).find("td:nth-child(1)").text() == "Channels") {

                                    var channelsList = [];
                                    for (var i = 0; i < 10; i++) {
                                        var link = $(this).find("td a:nth-child(" + i + ")").attr('href');
                                        if (link) {
                                            channelsList.push(link);
                                        }
                                    }
                                    liveIcoInstance.setChannels(channelsList);
                                }

                                if ($(this).find("td:nth-child(1)").text() == "Country") {
                                    //liveIcoModel["country"] = $(this).find("td:nth-child(2)").text();
                                    liveIcoInstance.setCountry($(this).find("td:nth-child(2)").text());
                                }

                                if ($(this).find("td:nth-child(1)").text() == "Links") {
                                    //liveIcoModel["homePage"] = $(this).find("td p a").attr('href');
                                    liveIcoInstance.setHomePage($(this).find("td p a").attr('href'));

                                    //liveIcoModel["whitePaper"] = $(this).find("td p:nth-child(2) a").attr('href');
                                    liveIcoInstance.setWhitePaper($(this).find("td p:nth-child(2) a").attr('href'));
                                }

                            });

                            //sleep(depositDataInterval * 1000);
                            //liveIcosList.push(liveIcoInstance);
                            //console.log(JSON.stringify(liveIcoInstance,null,2));
                            //liveIcosList.push(liveIcoInstance);
                            //var liveIcosList = [1];
                            //liveIcosList.delayedForEach(function(){
                            //setTimeout(function(){ console.log("muie"); },depositDataInterval * 1000);


                            var options = {
                                method: 'PUT',
                                url: 'https://cryptoment-api.mybluemix.net/api/icowatchlist_live_models',
                                headers: {
                                    accept: 'application/json',
                                    'content-type': 'application/json',
                                    'x-ibm-client-secret': 'e399a9e4ba39d2941cb14875f7545e418a96ca905c7b7915f6199b87adde9467',
                                    'x-ibm-client-id': '62384ebd-6575-4fa6-b4ef-b1886c6c7d26-bluemix'
                                },
                                body: {
                                    "id": liveIcoInstance.id,
                                    "name": liveIcoInstance.name,
                                    "market": liveIcoInstance.market,
                                    "endsOn": liveIcoInstance.endsOn,
                                    "startsOn": liveIcoInstance.startsOn,
                                    "homePage": liveIcoInstance.homePage,
                                    "whitePaper": liveIcoInstance.whitePaper,
                                    "platform": liveIcoInstance.platform,
                                    "progress": liveIcoInstance.progress,
                                    "founders": liveIcoInstance.founders,
                                    "channels": liveIcoInstance.channels,
                                    "country" : liveIcoInstance.country,
                                    "logo": liveIcoInstance.logo
                                },
                                json: true
                            };


                            throttledRequest(options, function (error, response, body) {
                                if (error) return console.error('Failed: %s', error.message);
                                console.log('Success: ', body);
                            });

                        });
                    }

                });

        }
    });
}, updateDataInterval * 1000);

/*
body.on('name', function () {
    var name = body.data.substring(0, body.data.indexOf(' ICO'));
    //console.log(name);
    // console.log(body.data); // HOORAY! THIS WORKS!
});
*/