import { chromium, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

type scriptAction = {
    name: string,
    selector: string,
    method: string,

}
let config = {
    "baseURL": "https://forums.redflagdeals.com",
    "newsListURL": "/hot-deals-f9/?sk=tt&rfd_sk=tt&sd=d",
    "articleListSelector": `li.row.topic:not(.sticky):not(.deleted) ul.dropdown 
    li:first-child a:first-child`,
    "articleSelectors": {
        "paragraphs": "div.content-col p",
        "creationTime": "p.publish-date",
        "updateTime": "p.last-modified-date",
        "title": "h1.article-title",
        "author": "p.authors>a"
    },
    "source": "Redflag Deals."
}

// document.querySelectorAll(
//     `li.row.topic:not(.sticky):not(.deleted) ul.dropdown 
//     li:first-child a:first-child`).forEach(a => console.log(a.getAttribute('href')))

// document.querySelectorAll("li.row.topic:not(.sticky):not(.deleted) ul:first-child a")
//.forEach(a=>console.log(a.getAttribute('href')) )
export async function scrapeNewsSite(config: any) {
    // Load the configuration file
    //const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(`${config.baseURL}${config.newsListURL}`);
    const articleLinks = await page.$$(config.articleListSelector);
    const urls = [];

    for (let linkElement of articleLinks) {
        const link = await linkElement.getAttribute('href');
        console.log(link);
        if (link) {
            if (link.startsWith(config.baseURL)) {
                urls.push(link)
            } else {
                urls.push(`${config.baseURL}${link}`);
            }
        }
    }


    let returnList = [];
    for (let url of urls) {
        try {
            await page.goto(url, { timeout: 60000 });
            const dataInList: any[] = []
            const test = await page.$$eval("dl.post_offer_fields > *",
                (elements: HTMLElement[]) => {
                    return elements.map((element: HTMLElement, index) => {
                        return element.innerText
                    })
                });
        } catch (error) {
            console.error('Error navigating to:', url, error);
        }
    }
    await browser.close();
    // return returnList;
}

async function getText(page: Page, selector: string) {
    const element = await page.$(selector);
    if (!element) return '';

    // Check if the element contains a link
    const link = await element.$('a');
    if (link) {
        return await link.innerText();
    } else {
        return await element.innerText();
    }
}


scrapeNewsSite(config)