const puppeteer = require("puppeteer-extra")
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
require('dotenv').config();

const timeout = 1 // after every 10 seconds, the bot reloads the page to check if putter is available

const username = process.env.scotty_email;
const password = process.env.scotty_password;
const gmail_username = process.env.gmail_username;
const gmail_password = process.env.gmail_password;
const name = process.env.card_owner_name
const card_num = process.env.card_number
const month = process.env.card_month
const year = process.env.card_year
const code = process.env.card_security_code

function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
}

const escapeXpathString = str => {
    const splitedQuotes = str.replace(/'/g, `', "'", '`);
    return `concat('${splitedQuotes}', '')`;
};
  
const clickByText = async (page, text, elem) => {
    const escapedText = escapeXpathString(text);
    const linkHandlers = await page.$x(`//${elem}[contains(text(), ${escapedText})]`);

    if (linkHandlers.length > 0) {
        await linkHandlers[0].click();
    } else {
        throw new Error(`Link not found: ${text}`);
    }
};


async function enable_cookie(){
    puppeteer.use(StealthPlugin());
    const browser = await puppeteer.launch({ headless: false, args: ['--disable-web-security', 
    '--disable-features=IsolateOrigins,site-per-process']})
    let page = await browser.newPage();
    page.setDefaultTimeout(0);
    await page.goto('https://dashboard.hcaptcha.com/signup?type=accessibility');
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', gmail_username, {delay: 100})
    let btn = await page.$('button');
    await btn.click();
    await page.waitForTimeout(2000);

    await page.goto('https://accounts.google.com/')
    await page.waitForSelector('input[type="email"]')
    await page.click('input[type="email"]')

    await page.type('input[type="email"]', gmail_username, {delay: 50})

    await page.waitForSelector('#identifierNext')
    await page.click('#identifierNext')

    await sleep(500);

    await page.click('input[type="email"]')
    await page.waitForTimeout(2000);
    await page.type('input[type="password"]', gmail_password, {delay: 10})

    await page.waitForSelector('#passwordNext')
    await page.click('#passwordNext');
    await page.waitForTimeout(2000);
    await page.goto("https://mail.google.com/mail/u/0/#inbox")
    await page.waitForTimeout(5000);
    await page.evaluate(()=>{
        let table = document.querySelectorAll('tbody');
        let tr = table[6].querySelector('tr')
        tr.click();
    })
    sleep(2000);
    let img = await page.$('img[class="ajT"]');
    if(img){
        await img.click();
    }
    await clickByText(page, "Get Accessibility Cookie", 'a');
    
    await page.waitForTimeout(3000);
    const pages = await browser.pages();
    const page2 = await pages[pages.length - 1];
    page2.setDefaultTimeout(0);
    await clickByText(page2, "Set Cookie", 'span');
    return page2;
}


async function login(page){

    await page.type('input[name="Username"]', username, {delay: 50})
    await page.type('input[name="Password"]', password, {delay: 50})
    let check = await page.$('div[class="col-xs-12 col-sm-6 nopadding styled-input remember-me"]')
    await check.click()
    let button = await page.$('button[class="btn-text-login btn-bg-primary"]')
    await button.click()
    await page.waitForNavigation();
    // url = 'https://www.scottycameron.com/store/gallery-putters/'
    url = "https://www.scottycameron.com/store/speed-shop-creations/"
    await page.goto(url)
    await page.waitForTimeout(5000)
}

async function getAccess(page){
    let access = await page.$('div[class="accessibility-desktop"]')
    await access.click()
    await page.waitForNavigation();
}

async function checkout(page){
    console.log('checking out ...')
    checkout_url = "https://www.scottycameron.com/store/checkout/index/"
    await page.goto(checkout_url)
    // await page.waitForNavigation();
    // await page.waitForSelector('input[id="radioPaymentProviders1"][value="MASTERCARD"]', {visible: true, timeout: 300000 });
    // await page.click('input[id="radioPaymentProviders1"][value="MASTERCARD"]')
    // await page.click('input[id="radioPaymentProviders1"][value="MASTERCARD"]')
    // await page.click('input[id="radioPaymentProviders1"][value="MASTERCARD"]')
    await page.waitForSelector('input[id="CardHolderName"]', {visible: true, timeout: 300000 });
    await page.type('input[id="CardHolderName"]', name, {delay: 1})
    await page.type('input[id="CredidCardNumber"]', card_num, {delay: 1})
    await page.type('input[id="CredidCardExpMonth"]', month, {delay: 1})
    await page.type('input[id="CredidCardExpYear"]', year, {delay: 1})
    await page.type('input[id="CredidCardCVCNumber"]', code, {delay: 1})
    await page.waitForSelector('input[id="checkoutTermsAndConditions-Box"]', {visible: true, timeout: 300000 });
    let check = await page.$('input[id="checkoutTermsAndConditions-Box"]')
    await check.click()
    let submit = await page.$('button[id="btnCompleteCheckout"]')
    // await submit.click()
    
    // let skip = await page.$('div[class="button-submit button"]')
    // while(skip){
    //     await skip.click()
    //     await page.waitForTimeout(3000)
    //     skip = await page.$('div[class="button-submit button"]')
    // }
    console.log("Order has been placed!")
    return;
}

async function track(page){
    check = true
    let x = 1
    console.log("tracking ... ")
    while(check){
        putters = await page.$$('li[data-test-selector="listProductsList"]')
        for(let putter of putters){
            let div = await putter.$$('div[class="tocart"]')
            if(div.length){
                // putter is available
                if(div.length >= 2){
                    await div[2].click()
                }else{
                    await div[div.length - 1].click()
                }
                await page.waitForTimeout(1000);
                await checkout(page)
                check = false;
                break;
            }
        }
        x++;
        if(x > timeout*1000){
            x = 1
            await page.reload()
            await page.waitForTimeout(4000)
            let link = page.url()
            if(link.includes("login")){
                await login(page)
            }
        }
    }
}
async function home(page){
    let url = 'https://www.scottycameron.com/store/user/login/'
    page.goto(url)
    await page.waitForNavigation();
    await getAccess(page)
    await page.waitForTimeout(2000);
    await login(page);
    return page;
}
async function main() {
    let page = await enable_cookie();
    await home(page);
    await track(page)
}

main()