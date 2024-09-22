const playwright = require("playwright");
const chromium = playwright.chromium;

const tplinkweburl = "https://www.thesource.ca/en-ca/brands/tp-link/c/tp-link?categoryCode=tp-link&view=grid&page=0&sort=price-desc&cleanPageNum=true&q=%3Aprice-desc"
const boseurl = "https://www.thesource.ca/en-ca/brands/bose/c/bose?categoryCode=bose&view=grid&page=0&sort=relevance"
const thesource = async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    let productListTag = "div.product-info"
    let nameSelector = "div.head span"
    let priceSelector = "div.price-row div"
    let stockSelector = "ul.custom-stock-icon"

   
    async function extractDetailsFromCard(card) {
        
        const name = await card.$eval(nameSelector, span => span.innerText);
        const price = await card.$eval(priceSelector, span => span.innerText);
        const stock = await card.$eval(stockSelector, span => span.innerText);

        return { name, price, stock };
    }
   
    await page.goto(tplinkweburl);
    await page.waitForTimeout(10000);
    let cards = await page.$$(productListTag)
    const tplinkcardDetails = await Promise.all(cards.map(card => extractDetailsFromCard(card)))
    
   
    await page.goto(boseurl);
    await page.waitForTimeout(10000);
    let bosecards = await page.$$(productListTag)
    const bosecardDetails = await Promise.all(bosecards.map(card => extractDetailsFromCard(card)))  
    await browser.close()
    return [...tplinkcardDetails, ...bosecardDetails]
    
    
}


module.exports = { thesource }

if (require.main === module) {

    thesource().then(v => {
       console.log(v)
    })

}
