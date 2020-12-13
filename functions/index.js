const functions = require('firebase-functions');
const express = require('express');
const puppeteer = require('puppeteer');

const baseUrl = "https://mechgroupbuys.com";
let browserPromise = puppeteer.launch( { headless: true, args: ['--no-sandbox']} );
const app = express();

const validateJSON = (data) => {
    if (data.length==0) {
        return false;
    }
    else {
        return true;
    }
};

app.get("/", (req,res) => {
    res.redirect("https://github.com/louismeunier");
});
app.get("/test", (req,res) => {
    res.json({"Current Date":`${Date.now()}`});
});

app.get("/about", (req,res) => {
    res.json({"About":"This api is a wrapper of https://mechgroupbuys.com, and its numerous routes. It is meant to provide a more convenient method of accessing data about upcoming keyboard sales. I am not associated with mechgroupbuys.com in any way, and make no money or benefit in anyway off this api. You can learn more at my github, https://github.com/louismeunier"});
});

const scraper = async (route) => {

    console.log(baseUrl+route);
    //maybe add error handling for invalid routes?
    const browser = await browserPromise;
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    await page.goto(baseUrl+route, {waitUntil: 'networkidle0'});
    //const html = await page.content();
    //console.log(typeof html);
    const imgs= await page.evaluate(() => {
        let elements = Array.from(document.querySelectorAll('img.sc-fzpmMD.enYpte'));
        let links = elements.map(element => {
            return element.src
        })
        return links;
    });

    const links= await page.evaluate(() => {
        let elements = Array.from(document.querySelectorAll('div.sc-fznMAR.gSVBBi a'));
        let links = elements.map(element => {
            return element.href
        })
        return links;
    });

    var newLinks = [];
    for (var i = 0; i<links.length;i+=2) {
        newLinks.push(links[i]);
    };
    const info = await page.evaluate(() => {
        let elements = Array.from(document.querySelectorAll('ul.sc-fzoKki.kNKLJw'));
        let links = elements.map(element => {
            return element.textContent;
        })
        return links;
    });


    var name;
    
    var response = {};
    for (var i=0; i<imgs.length;i+=1) {
        var infoDB = {};
        name = newLinks[i].slice(newLinks[i].lastIndexOf("/")+1);
        var info1 = info[i].replace(/(Start date:)|(End date:)|(Base price:)|(Sale Type:)/g,"˚");
        var infoSplit = info1.split("˚");

        infoDB['startDate'] = infoSplit[1];
        infoDB['endDate'] = infoSplit[2];
        infoDB['basePrice'] = infoSplit[3];
        infoDB['saleType'] = infoSplit[4];
        console.log(infoDB);
        response[name] = {
            "img": imgs[i],
            "link": newLinks[i],
            "info": infoDB
        };
    };
     

    await context.close();
    return response;    
}

app.get("/keyboards", (req,res) => {
    res.set("Cache-Control","public, max-age=3600, s-maxage=4000");
    //console.log(/bic,live,ended,upcoming/b.test(status));
    (async () => {
        var jsonResponse;
        status = req.query.status;
        if (status!='live' && status!='ic' && status!='ended' && status!='upcoming') {
            console.log("invalid route");
            jsonResponse = {"Error":`Invalid status code, ${status}. Must be [live,ic,ended,upcoming]`};
        }
        else {
            console.log("valid route");
            jsonResponse = await scraper("/keyboards?status="+status);
        }
        if (!validateJSON(jsonResponse)) {
            jsonResponse = {"Error":"No data found for this route. Either an issue has occured with the endpoint, or no data exists on mechgroupbuys.com"};
        }
        res.json(jsonResponse);
    })();
    
})

app.get("/keycaps", (req,res) => {
    res.set("Cache-Control","public, max-age=3600, s-maxage=4000");
    //console.log(/bic,live,ended,upcoming/b.test(status));
    var jsonResponse = {};
    (async () => {
        
        status = req.query.status;
        if (status!='live' && status!='ic' && status!='ended' && status!='upcoming') {
            console.log("invalid route");
            jsonResponse = {"Error":`Invalid status code, ${status}. Must be [live,ic,ended,upcoming]`};
        }
        else {
            console.log("valid route");
            jsonResponse = await scraper("/keycaps?status="+status);
        }
        if (!validateJSON(jsonResponse)) {
            jsonResponse = {"Error":"No data found for this route. Either an issue has occured with the endpoint, or no data exists on mechgroupbuys.com"};
        }
        res.json(jsonResponse);
    })();
})

app.get("/switches", (req,res) => {
    res.set("Cache-Control","public, max-age=3600, s-maxage=4000");
    //console.log(/bic,live,ended,upcoming/b.test(status));
    var jsonResponse = {};
    (async () => {
        status = req.query.status;
        if (status!='live' && status!='ic' && status!='ended' && status!='upcoming') {
            console.log("invalid route");
            jsonResponse = {"Error":`Invalid status code, ${status}. Must be [live,ic,ended,upcoming]`};
        }
        else {
            console.log("valid route");
            jsonResponse = await scraper("/switches?status="+status);
        }
        if (!validateJSON(jsonResponse)) {
            jsonResponse = {"Error":"No data found for this route. Either an issue has occured with the endpoint, or no data exists on mechgroupbuys.com"};
        }
        res.json(jsonResponse);
    })();
})

exports.app = functions.https.onRequest(app);