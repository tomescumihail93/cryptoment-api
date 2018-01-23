/**
 * Created by billy G on 22/01/2018.
 */

var request = require('request');
var cheerio = require('cheerio');

var liveIcosList = []
var liveIcoModel = {
    "channels":"",
    "endsOn":"",
    "founders":"",
    "homePage":"",
    "id":"",
    "logo":"",
    "market":"",
    "name":"",
    "platform":"",
    "progress":"",
    "startsOn":"",
    "whitePaper":""
};

var detailedicoPage = function(page) {

    request(page, function (error, response, html) {

        if (!error && response.statusCode == 200)  {

            var $ = cheerio.load(html);
            var str = "";

            $('tr').each(function(i, element){
                if (i>0 && i<10) {
                    var currentStr = $(this).text();
                    if (currentStr.includes("Channels")) {
                        currentStr = ' ';
                        $(this).children().children().each(function (j, newelement) {
                            var bla = currentStr==' ' ? ' ':"";
                            currentStr = bla + ' ' + $(this).attr('href');
                            //console.log(currentStr);
                            str = str + currentStr;
                        })
                    }
                    else if (currentStr.includes("Links")) {
                        currentStr = ' ';
                        $(this).children().children().each(function (k, newerelement) {         //For each p
                            var bla = currentStr==' ' ? ' ':"";
                            currentStr = bla + ' '+$(this).children().attr('href');
                            //console.log(currentStr);
                            str = str + currentStr;
                        })
                    }
                    else
                        str = str + currentStr;
                }
            });

            var start = str.indexOf("Progress");
            var end = str.indexOf("%");
            var name = str.substring(start, end+1);
            str = str.replace(name,"");
            str = str.replace(/Founders/,"  ");
            str = str.replace(/ICO Start/,"  ");
            str = str.replace(/ICO End/,"  ");
            str = str.replace(/\n/g,"");
            str = str.replace(/\t/g,"");
            str = str.replace(/Platform/,"  ");
            str = str.replace(/Country/,"  ");
            str = str.replace(/Ticker/,"  ");

            console.log(str);
        }

    });

};



//var details = require('./scrapedetails.js');

var mainPage = 'https://icowatchlist.com';
request(mainPage, function (error, response, html) {

    if (!error && response.statusCode == 200) {
        var $ = cheerio.load(html);

        $('tr').each(function(i, element){
            if (i > 0 && i < 39) {
                var data = $(this).children().children().children().children().children().children().attr('alt') + ($(this).text().replace(/\s\s+/g, ' '));
                var icoPage = mainPage+'/' + $(this).children().children().children().children().children().attr('href');
                var extra = detailedicoPage(icoPage); //The return value from scrapedetails.js
                var str = data + extra;


                while (str.indexOf("ENDS IN")!=-1) {
                    var start = str.indexOf("ENDS IN");
                    var end = str.indexOf("%", start+1);
                    var name = str.substring(start, end-2);
                    str = str.replace(name,"");
                }
                str = str.replace(/ICO Details/g,"");
                str = str.replace(/PRESALE/g,"");
                str = str.replace(/ICO/g,"");
                str = str.replace(/\r\n/g," ");
                str = str.replace(/   /g,"  ");
                str = str.replace(/   /g,"  ");
                str = str.replace(/%/g,"");

                //console.log(str);

            }

        });
    }
});




