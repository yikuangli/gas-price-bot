const playwright = require("playwright");
const chromium = playwright.chromium;


let config = {
    "baseURL": "https://forums.redflagdeals.com",
    "newsListURL": "/hot-deals-f9/?sk=tt&rfd_sk=tt&sd=d",
    "articleListSelector": `li.row.topic:not(.sticky):not(.deleted) ul.dropdown 
    li:first-child a:first-child`,
    "source": "Redflag Deals."
}

const miniStack = [];
const MAX_STACK_SIZE = 50; // Define the maximum size of the stack

function addToStack(item) {
    if (miniStack.length >= MAX_STACK_SIZE) {
        miniStack.shift(); // Remove the oldest item
    }
    miniStack.push(item); // Add the new item
}

function isItemNew(item) {
    return !miniStack.some(stackItem =>
        stackItem.url === item.url || (
            stackItem.author === item.author && stackItem.time === item.time) ||
        stackItem.title === item.title
    );
}





let cardSelector = "li.row.topic:not(.sticky):not(.deleted)"

let url = "ul.dropdown li:first-child a:first-child" // href
let author = "span.thread_meta_author" // innerText
let time = "span.first-post-time" // innerText

const rfdeals = async (config, init = false) => {
    // Load the configuration file
    //const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    try {
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto(`${config.baseURL}${config.newsListURL}`);
        let finalItemList = [];
        const details = await extractCardDetails(page);
        let newItems = [];
        for (let item of details) {
            if (isItemNew(item)) {
                // Crawl the item
                addToStack(item);
                newItems.push(item)
                // ... your crawling logic ...
            } else {
                break;
            }
        }
        if (!init) {
            newItems.forEach(item => {
                finalItemList.push({
                    title: item.title,
                    content: `${item.url}`
                })
            })
            //  console.log(newItems);
        }
        if (browser) await browser.close();
        return finalItemList;
    } catch (e) {
        if (browser) await browser.close();
        console.log("error when pareing")
        return []
    }
    // for (let url of urls) {
    //     try {
    //         await page.goto(url, { timeout: 60000 });
    //         const dataInList = []
    //         const test = await page.$$eval("dl.post_offer_fields > *",
    //             (elements) => {
    //                 return elements.map((element, index) => {
    //                     return element.innerText
    //                 })
    //             });
    //     } catch (error) {
    //         console.error('Error navigating to:', url, error);
    //     }
    // }

    // return returnList;
}


async function extractCardDetails(page) {
    // Selector strings
    const cardSelector = "li.row.topic:not(.sticky):not(.deleted)";
    const urlSelector = "ul.dropdown li:first-child a:first-child";
    const authorSelector = "span.thread_meta_author";
    const timeSelector = "span.first-post-time";
    const titleSelector = "a.topic_title_link";
    const retailerSelector1 = "a.topictitle_retailer";
    const retailerSelector2 = "h3.topictitle";

    // Function to extract details from a single card
    async function extractDetailsFromCard(card) {
        const url = await card.$eval(urlSelector, a => a.href);
        const author = await card.$eval(authorSelector, span => span.innerText);
        const time = await card.$eval(timeSelector, span => span.innerText);
        const title = await card.$eval(titleSelector, span => span.innerText)
        let retailer = '';
        // Try the first retailer selector
        const retailerElement1 = await card.$(retailerSelector1);
        if (retailerElement1) {
            retailer = await retailerElement1.innerText();
        }

        // If the first selector didn't work, try the second
        if (!retailer) {
            const retailerElement2 = await card.$(retailerSelector2);
            if (retailerElement2) {
                const text = await retailerElement2.innerText();
                // Extract retailer info from text, assuming it's in brackets "[retailer]"
                const matches = text.match(/\[(.*?)\]/);
                retailer = matches ? matches[1] : '';
            }
        }
        return { url, author, time, title, retailer };
    }

    // Get all cards
    const cards = await page.$$(cardSelector);

    // Map over each card and extract details
    const cardDetails = await Promise.all(cards.map(card => extractDetailsFromCard(card)));

    return cardDetails;
}

// Usage example
// Assuming 'page' is your Playwright page object


module.exports = { rfdeals }

if (require.main === module) {


    `Name: Domain Name Generator
    Description: I generate creative domain names based on your 
    Link: https://chat.openai.com/g/g-IFxYLMRWG-domain-name-generator`


    rfdeals(config,).then(a => {
        console.log(a)
    })

    setInterval(async () => {
        rfdeals(config)
    }, 60 * 1000)
}