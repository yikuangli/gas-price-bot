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


// Function to scrape train information
async function scrapeTrainInfo(filter = false) {
    // Get the current time
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check if the current time is before 07:45 or after 08:15
    if (filter && !inTimeRanges([["07:45", "08:15"]])) {
        return [];
    }

    try {
        const url = 'https://www.gotransit.com/en/find-a-station-or-stop/mp/routes-departures?q=departures';
        // Launch the browser
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto(url);

        // Extract multiple train/bus information
        const departures = await page.locator('[data-testid="departures-accordion-drawer-heading-container"]');
        const count = await departures.count();
        let info = []
        for (let i = 0; i < count; i++) {
            const departureStopsDisplay = await departures.nth(i).locator('[data-testid="departures-stops-display"]').textContent();
            const scheduledTime = await departures.nth(i).locator('[data-testid="scheduled-cell-value"]').textContent();
            const platform = await departures.nth(i).locator('[data-testid="platform-cell-value"]').textContent();
            const status = await departures.nth(i).locator('[data-testid="status-cell-value"]').textContent();
            info.push({ departureStopsDisplay: departureStopsDisplay.trim(), scheduledTime: scheduledTime.trim(), platform: platform.trim(), status: status.trim() })
        }

        // Close the browser
        if (browser) await browser.close();
        return info
    } catch (error) {
        if (browser) await browser.close();
        console.error('Error scraping train info:', error);
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

