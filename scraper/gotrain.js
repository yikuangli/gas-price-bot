const { chromium } = require('playwright');

// Function to scrape train information
async function scrapeTrainInfo(filter = false) {
    // Get the current time
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check if the current time is before 07:45 or after 08:15
    if (filter && (
        (currentHour < 7) || (currentHour === 7 && currentMinute < 45) || (currentHour > 8) || (currentHour === 8 && currentMinute > 15)
    )) {
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
        if (info.filter(v => (v.scheduledTime.includes("07:59") || v.scheduledTime.includes("08:14")) || !filter).length > 0) {
            return info//info.filter(v => v.departureStopsDisplay.includes("Union Station"))
        }
        return []
    } catch (error) {
        if (browser) await browser.close();
        console.error('Error scraping train info:', error);
    }
}
// Replace with the URL that you want to scrape


// Call the function

module.exports = { scrapeTrainInfo }

if (require.main === module) {

    scrapeTrainInfo(url).then(v => {
        console.log(v)
    })

}

