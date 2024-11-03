const { chromium } = require('playwright');

function inTimeRanges(timeRanges) {
    // Get the current time in the "America/Toronto" time zone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Toronto',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
    });
    const parts = formatter.formatToParts(now);
    const hours = parseInt(parts.find(part => part.type === 'hour').value, 10);
    const minutes = parseInt(parts.find(part => part.type === 'minute').value, 10);
    const currentTime = hours * 60 + minutes;

    return timeRanges.some(range => {
        const [start, end] = range.map(time => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        });

        if (start <= end) {
            return currentTime >= start && currentTime <= end;
        } else {
            return currentTime >= start || currentTime <= end;
        }
    });
}

const configs = [
    {
        url: "https://www.gotransit.com/en/find-a-station-or-stop/mp/routes-departures?q=departures",
        desiredTime: ["07:59", "08:14"],
        trainID: null,
        searchTimeRange: [["07:45", "08:15"]]
    },
    {
        url: "https://www.gotransit.com/en/find-a-station-or-stop/un/routes-departures",
        desiredTime: ["16:38", "17:08", "17:23"],
        trainID: "Barrie",
        searchTimeRange: [["16:30", "17:30"]]
    }
];

const SELECTORS = {
    departuresContainer: '[data-testid="departures-accordion-drawer-heading-container"]',
    serviceName: '[data-testid="departures-service-name"]',
    stopsDisplay: '[data-testid="departures-stops-display"]',
    scheduledTime: '[data-testid="scheduled-cell-value"]',
    platform: '[data-testid="platform-cell-value"]',
    status: '[data-testid="status-cell-value"]'
};

// Function to scrape train information
async function scrapeTrainInfo(filter = false) {
    let config;

    for (const v of configs) {
        const timeMatch = inTimeRanges(v.searchTimeRange);
        if (!filter || timeMatch) {
            config = v;
            break; // Exit the loop after finding the first matching config
        }
    }

    if (!config) {
        return [];
    }

    let browser = null; // Initialize browser to null

    try {
        const url = config.url;
        // Launch the browser
        browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto(url);

        // Extract multiple train/bus information
        const departures = await page.locator(SELECTORS.departuresContainer);
        const count = await departures.count();
        let info = [];
        for (let i = 0; i < count; i++) {
            const trainID = await departures.nth(i).locator(SELECTORS.serviceName).textContent();
            const departureStopsDisplay = await departures.nth(i).locator(SELECTORS.stopsDisplay).textContent();
            const scheduledTime = await departures.nth(i).locator(SELECTORS.scheduledTime).textContent();
            const platform = await departures.nth(i).locator(SELECTORS.platform).textContent();
            const status = await departures.nth(i).locator(SELECTORS.status).textContent();
            info.push({
                trainID: trainID.trim(),
                departureStopsDisplay: departureStopsDisplay.trim(),
                scheduledTime: scheduledTime.trim(),
                platform: platform.trim(),
                status: status.trim()
            });
        }
        // Close the browser
        await browser.close();
        return info
            .filter(v => config.desiredTime.includes(v.scheduledTime))
            .filter(v => !config.trainID || v.trainID.includes(config.trainID));
    } catch (error) {
        if (browser) await browser.close();
        console.error('Error scraping train info:', error);
        throw error; // Re-throw the error
    }
}

module.exports = { scrapeTrainInfo };

if (require.main === module) {
    (async () => {
        try {
            console.log(inTimeRanges([["23:35", "23:59"]]))
            // const result = await scrapeTrainInfo(true);
            // console.log(result);
        } catch (error) {
            console.error('An error occurred:', error);
        }
    })();
}
