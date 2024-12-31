const playwright = require("playwright");
const chromium = playwright.chromium;

// https://forums.redflagdeals.com/hot-deals-f9/?sk=t&rfd_sk=t&sd=d
const config = {
    baseURL: "https://forums.redflagdeals.com",
    newsListURL: "/hot-deals-f9/?sk=tt&rfd_sk=tt&sd=d",
    source: "RedFlagDeals"
};

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
        stackItem.url === item.url ||
        (stackItem.author === item.author && stackItem.time === item.time)
    );
}

async function rfdeals(config, init = false) {
    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        const targetURL = `${config.baseURL}${config.newsListURL}`;
        console.log(`Navigating to ${targetURL}`);
        await page.goto(targetURL);

        await page.waitForTimeout(1000); // Throttle requests
        // const bodyContent = await page.evaluate(() => document.body.innerHTML);
        // console.log("Page body content:", bodyContent);
        // Get content within site_container div
        const topicList = await page.$('ul.topiclist.topics.with_categories');
        // Get all li elements and print their data-thread-id attributes
        // const liElements = await topicList.$$('li');
        // for (const li of liElements) {
        //     const threadId = await li.evaluate(node => node.getAttribute('data-thread-id'));
        //     console.log(`Thread ID: ${threadId}`);
        // }
        // const topicListContent = await topicList.evaluate((node) => node.innerHTML);
        // console.log("Topic list content:", topicListContent);
        // if (!topicList) {
        //     console.log("No topic list found");
        //     return [];
        // }

        // const topics = await topicList.$$('li:not(.sticky):not(.deleted)');
        // console.log(`Found ${topics.length} topics`);

        // for (const topic of topics) {
        //     const topicContent = await topic.evaluate(node => node.textContent);
        //     console.log("Topic content:", topicContent.trim());
        // }
   
       
       
        // const topicListContent = await page.evaluate(() => {
        //     const topicList = document.querySelector('ul.topiclist.topics.with_categories');
        //     return topicList ? topicList.innerHTML : '';
        // });
        // console.log("Topic list content:", topicList);
        // const containerContent = await page.evaluate(() => {
        //     const container = document.querySelector('#site_container');
        //     return container ? container.innerHTML : '';
        // });
        // console.log("Site container content:", containerContent);
        const details = await extractCardDetails(topicList);

        console.log(`Total items extracted: ${details.length}`);
        let newItems = [];
        for (let item of details) {
            if (isItemNew(item)) {
                addToStack(item);
                newItems.push(item);
            } else {
                continue;
            }
        }
        console.log(`New items found: ${newItems.length}`);
        let finalItemList = [];
        if (!init) {
            newItems.forEach(item => {
                finalItemList.push({
                    title: item.title,
                    content: `${item.url}`
                });
            });
        }
        return finalItemList;
    } catch (e) {
        console.error("Error when parsing:", e);
        return [];
    } finally {
        if (browser) await browser.close();
    }
}

async function extractCardDetails(page) {
    // Selector strings
    const cardSelector = "li:not(.sticky):not(.deleted)";
    const urlSelector = "a.topic_title_link"; //"a.topic_title_link"; //"ul.dropdown li:first-child a:first-child";
    const authorSelector = "span.thread_meta_author";
    const timeSelector = "span.first-post-time";
    const titleSelector = "a.topic_title_link";
    const retailerSelector1 = "a.topictitle_retailer";
    const retailerSelector2 = "h3.topictitle";

    // Function to extract details from a single card
    async function extractDetailsFromCard(card) {
        try {
            console.log('Card:', await card.evaluate(el => el.innerHTML));
            // Get the element and print its innerHTML
            // const urlElement = await card.$(urlSelector);
            // const innerHTML = await page.evaluate(el => el.innerHTML, urlElement);
            // console.log('URL Element innerHTML:', innerHTML);

            const url = await card.$eval(urlSelector, a => a.href);
            const author = await card.$eval(authorSelector, span => span.innerText.trim());
            const time = await card.$eval(timeSelector, span => span.innerText.trim());
            const title = await card.$eval(titleSelector, span => span.innerText.trim());
            let retailer = '';

            // Try the first retailer selector
            const retailerElement1 = await card.$(retailerSelector1);
            if (retailerElement1) {
                retailer = (await retailerElement1.innerText()).trim();
            }

            // If the first selector didn't work, try the second
            if (!retailer) {
                const retailerElement2 = await card.$(retailerSelector2);
                if (retailerElement2) {
                    const text = (await retailerElement2.innerText()).trim();
                    // Extract retailer info from text, assuming it's in brackets "[retailer]"
                    const matches = text.match(/\[(.*?)\]/);
                    retailer = matches ? matches[1].trim() : '';
                }
            }
            return { url, author, time, title, retailer };
        } catch (error) {
            console.error('Error extracting details from card:', error);
            return null; // Return null to indicate failure
        }
    }

    // Get all cards
    const cards = await page.$$(cardSelector);
    let singleCard = await extractDetailsFromCard(cards[4])
    // Map over each card and extract details
    const cardDetails = (await Promise.all(cards.map(card => extractDetailsFromCard(card))))
        .filter(detail => detail !== null);

    return cardDetails;
}

module.exports = { rfdeals };

if (require.main === module) {
    (async () => {
        try {
            await rfdeals(config, true);
            console.log('Initial run completed.');
        } catch (error) {
            console.error('Error during initial run:', error);
        }

        setInterval(async () => {
            try {
                const newItems = await rfdeals(config);
                if (newItems.length > 0) {
                    console.log('New items found:', newItems);
                } else {
                    console.log('No new items found.');
                }
            } catch (error) {
                console.error('Error in interval function:', error);
            }
        }, 60 * 1000);
    })();
}
