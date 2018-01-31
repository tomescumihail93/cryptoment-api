/**
 * Author: Michel Cojocaru
 * company: Cryptoment
 * */

/**
 * Update duration 6 min
 * Write interval 0.5 sec
 */

/**
 * Attention! Be aware of the fact that in a long
 * period of time the memory leak cause by the lack
 * of icoInstance dereference will cause a crash eventually
 */

var cheerio = require('cheerio');
var request = require('request');
var throttledRequest = require('throttled-request')(request);
var waitBeforeNextPageInterval = 120;
var depositDataInterval = 0.5;//seconds

throttledRequest.configure({
    requests: 1,
    milliseconds: depositDataInterval * 1000
});

var icoStates = {
    2: "live",
    3: 'upcoming',
    4: 'finished'
};

var initial_id = 1913112091000832;

class Ico{

    constructor(){

        this.id = "";
        this.name = "";
        this.market = "";
        this.endsOn = "";
        this.startsOn = "";
        this.homePage = "";
        this.platform = "";
        this.ticker = "";
        this.progress = "";
        this.country = "";
        this.whitePaper = "";
        this.founders = [""];
        this.channels = [""];
        this.logo = "";

        this.crowdSale = "";
        this.raised = "";
        this.roi = "";

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

    setTicker(ticker){
        this.ticker = ticker;
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

    setCrowdSale(crowdSale){
        this.crowdSale = crowdSale;
    }

    setRaised(raised){
        this.raised = raised;
    }

    setRoi(roi){
        this.roi = roi;
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

//TODO dereferentiaza intanta de ico ca sa nu ai memory leak

//run();

//Scrape ICO's
exports.run = function run() {

    Object.keys(icoStates).delayedForEach(function (key) {
        request('https://icowatchlist.com/' + icoStates[key], function (error, response, html) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                var id = initial_id.toString();

                $('table.main-ico-table tr').each(function (i, elem) {

                    var icoInstance = new Ico();
                    icoInstance.setId(String(id++));
                    icoInstance.setMarket($(this).find("td div.row div a p span").text());

                    //finished icos page
                    if (key == 4) {
                        var raised = $(this).find("td div.row div div.ticker-inner-div div.price-unit-div p").text();
                        if (raised.substring(0, raised.indexOf(':')) == "Raised") {
                            icoInstance.setRaised(raised.substring(raised.indexOf(': ') + 2, raised.indexOf("Now:")));
                            icoInstance.setRoi(raised.substring(raised.indexOf("(") + 1, raised.indexOf("%)")));
                        }
                    }

                    var icoPath = $(this).find("td div.row div a").attr('href');

                    if (icoPath) {
                        request('https://icowatchlist.com/' + icoPath, function (error, response, html) {
                            var $ = cheerio.load(html);

                            $('table.main-ico-table tr').each(function (i, elem) {

                                var icoNameString = $(this).find("td div > img").attr('alt');
                                if (icoNameString) {
                                    icoInstance.setName(icoNameString.substring(0, icoNameString.indexOf(' ICO')));
                                }

                                if ($(this).find("td:nth-child(1)").text() == "Founders") {
                                    icoInstance.setFounders($(this).find("td:nth-child(2)").text().split(', '));
                                }

                                if ($(this).find("td:nth-child(1)").text() == "ICO Start") {
                                    icoInstance.setStartsOn($(this).find("td:nth-child(2)").text());
                                } else if ($(this).find("td:nth-child(1)").text() == "ICO End") {
                                    icoInstance.setEndsOn($(this).find("td:nth-child(2)").text());
                                }

                                if ($(this).find("td:nth-child(1)").text() == "Progress") {
                                    icoInstance.setProgress($(this).find("td:nth-child(2)").text().trim().replace("%", ""));
                                }

                                if ($(this).find("td:nth-child(1)").text() == "Platform") {
                                    icoInstance.setPlatform($(this).find("td:nth-child(2)").text());
                                }

                                if ($(this).find("td:nth-child(1)").text() == "Channels") {

                                    var channelsList = [];
                                    for (var i = 0; i < 10; i++) {
                                        var link = $(this).find("td a:nth-child(" + i + ")").attr('href');
                                        if (link) {
                                            channelsList.push(link);
                                        }
                                    }
                                    icoInstance.setChannels(channelsList);
                                }

                                if ($(this).find("td:nth-child(1)").text() == "Ticker") {
                                    icoInstance.setTicker($(this).find("td:nth-child(2)").text());
                                }

                                if ($(this).find("td:nth-child(1)").text() == "Country") {
                                    icoInstance.setCountry($(this).find("td:nth-child(2)").text());
                                }

                                if ($(this).find("td:nth-child(1)").text() == "Links") {

                                    if ($(this).find("td p a").attr('href')) {
                                        icoInstance.setHomePage($(this).find("td p a").attr('href'));
                                    }

                                    if ($(this).find("td p:nth-child(2) a").attr('href')) {
                                        icoInstance.setWhitePaper($(this).find("td p:nth-child(2) a").attr('href'));
                                    }

                                    if ($(this).find("td p:nth-child(3) a").attr('href')) {
                                        icoInstance.setCrowdSale($(this).find("td p:nth-child(3) a").attr('href'));
                                    }

                                }

                            });


                            var options = {
                                method: 'PUT',
                                url: 'https://cryptoment-api.mybluemix.net/api/icowatchlist_' + icoStates[key] + '_models',
                                headers: {
                                    accept: 'application/json',
                                    'content-type': 'application/json',
                                    'x-ibm-client-secret': 'e399a9e4ba39d2941cb14875f7545e418a96ca905c7b7915f6199b87adde9467',
                                    'x-ibm-client-id': '62384ebd-6575-4fa6-b4ef-b1886c6c7d26-bluemix'
                                },
                                body: {
                                    "id": icoInstance.id,
                                    "name": icoInstance.name,
                                    "market": icoInstance.market,
                                    "endsOn": icoInstance.endsOn,
                                    "startsOn": icoInstance.startsOn,
                                    "homePage": icoInstance.homePage,
                                    "whitePaper": icoInstance.whitePaper,
                                    "platform": icoInstance.platform,
                                    "ticker": icoInstance.ticker,
                                    "progress": icoInstance.progress,
                                    "founders": icoInstance.founders,
                                    "channels": icoInstance.channels,
                                    "country": icoInstance.country,
                                    "logo": icoInstance.logo,
                                    "crowdSale": icoInstance.crowdSale,
                                    "raised": icoInstance.raised,
                                    "roi": icoInstance.roi,
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
    }, waitBeforeNextPageInterval * 1000);
};

//TODO erase the DBs before you repopulate otherwise you will have the same ico in live and finished for instance
