const puppeteer = require("puppeteer-extra")
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

const wsChromeEndpointurl = ' ws://127.0.0.1:9222/devtools/browser/cc51e9e2-e582-4786-8c8c-571a7055fee1';

const email = "ahmednaeem.career@gmail.com";

function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
}

async function main(){
    puppeteer.use(StealthPlugin());
    const browser = await puppeteer.launch({ browserWSEndpoint: wsChromeEndpointurl, headless: false, args: ['--disable-web-security', 
    '--disable-features=IsolateOrigins,site-per-process']})
    const page = await browser.newPage();
    await page.goto('https://dashboard.hcaptcha.com/signup?type=accessibility')
    sleep(5000);
    await page.type('input[name="email"]', email, {delay: 100})
    let btn = await page.$('button');
    await btn.click();
}

main()