const { chromium } = require('playwright');

function inTimeRanges(timeRanges) {
    // Get the current time in the "America/Toronto" time zone
    const now = new Date().toLocaleString("en-US", { timeZone: "America/Toronto" });
    const [hours, minutes] = new Date(now).toTimeString().split(':').map(Number);
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



const configs = [{
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
]


// Function to scrape train information

// Function to scrape train information
async function scrapeTrainInfo(filter = false) {
    let config;

    for (const v of configs) {
        if (!(filter && !inTimeRanges(v.searchTimeRange))) {
            config = v;
            break; // Exit the loop after finding the first matching config
        }
    }

    if (!config) {
        return [];
    }

    let browser; // Declare browser outside the try block

    try {
        const url = config.url;
        // Launch the browser
        browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto(url);

        // Extract multiple train/bus information
        const departures = await page.locator('[data-testid="departures-accordion-drawer-heading-container"]');
        const count = await departures.count();
        let info = [];
        for (let i = 0; i < count; i++) {
            const trainID = await departures.nth(i).locator('[data-testid="departures-service-name"]').textContent();
            const departureStopsDisplay = await departures.nth(i).locator('[data-testid="departures-stops-display"]').textContent();
            const scheduledTime = await departures.nth(i).locator('[data-testid="scheduled-cell-value"]').textContent();
            const platform = await departures.nth(i).locator('[data-testid="platform-cell-value"]').textContent();
            const status = await departures.nth(i).locator('[data-testid="status-cell-value"]').textContent();
            info.push({
                trainID: trainID.trim(),
                departureStopsDisplay: departureStopsDisplay.trim(),
                scheduledTime: scheduledTime.trim(),
                platform: platform.trim(),
                status: status.trim()
            });
        }
        // Close the browser
        if (browser) await browser.close();
        return info
            .filter(v => config.desiredTime.includes(v.scheduledTime))
            .filter(v => !config.trainID || v.trainID.includes(config.trainID));
    } catch (error) {
        if (browser) await browser.close();
        console.error('Error scraping train info:', error);
        return []; // Return an empty array in case of error
    }
}
// Replace with the URL that you want to scrape


// Call the function

module.exports = { scrapeTrainInfo }

if (require.main === module) {

    scrapeTrainInfo(true).then(v => {
        console.log(v)
    })

}

