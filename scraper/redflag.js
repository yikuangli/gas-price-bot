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
        await page.goto(targetURL,);

        await page.waitForTimeout(1000); // Throttle requests

        const details = await extractCardDetails(page);
        console.log(`Total items extracted: ${details.length}`);
        let newItems = [];
        for (let item of details) {
            if (isItemNew(item)) {
                addToStack(item);
                newItems.push(item);
                // ... your crawling logic ...
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
    const cardSelector = "li.row.topic:not(.sticky):not(.deleted)";
    const urlSelector = "ul.dropdown li:first-child a:first-child";
    const authorSelector = "span.thread_meta_author";
    const timeSelector = "span.first-post-time";
    const titleSelector = "a.topic_title_link";
    const retailerSelector1 = "a.topictitle_retailer";
    const retailerSelector2 = "h3.topictitle";

    // Function to extract details from a single card
    async function extractDetailsFromCard(card) {
        try {
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
