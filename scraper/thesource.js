const playwright = require("playwright");
const chromium = playwright.chromium;

const tplinkweburl = "https://www.thesource.ca/en-ca/brands/tp-link/c/tp-link?categoryCode=tp-link&view=grid&page=0&sort=price-desc&cleanPageNum=true&q=%3Aprice-desc"
const boseurl = "https://www.thesource.ca/en-ca/brands/bose/c/bose?categoryCode=bose&view=grid&page=0&sort=relevance"
const sonyurl = "https://www.thesource.ca/en-ca/audio-headphones/headphones/all-headphones/c/scc-6-1-9?categoryCode=scc-6-1-9&view=grid&sort=relevance&cleanPageNum=true&q=%3Arelevance%3AFT-Headphones-Type%3AOver-Ear%3Abrand%3ASONY%3Abrand%3ASONY&page=0&show=All"

const thesource = async () => {
   
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
    try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(tplinkweburl);
    await page.waitForTimeout(5000);
    let cards = await page.$$(productListTag)
    const tplinkcardDetails = await Promise.all(cards.map(card => extractDetailsFromCard(card)))
    
   
    await page.goto(boseurl);
    await page.waitForTimeout(5000);
    let bosecards = await page.$$(productListTag)
    const bosecardDetails = await Promise.all(bosecards.map(card => extractDetailsFromCard(card)))  
  

    await page.goto(sonyurl);
    await page.waitForTimeout(5000);
    let sonycards = await page.$$(productListTag)
    const sonycardDetails = await Promise.all(sonycards.map(card => extractDetailsFromCard(card)))  
    let total = [...tplinkcardDetails, ...bosecardDetails, ...sonycardDetails]
    total = total.filter(item => item.price.includes(".96"))
    if (browser) await browser.close();
    return total
    } catch (e) {
        console.log(e)
        if (browser) await browser.close();
        return {error: e.toString()}
    }finally{
        if (browser) await browser.close();
    }
    
}


module.exports = { thesource }

if (require.main === module) {

    thesource().then(v => {
       console.log(v)
    })

}
