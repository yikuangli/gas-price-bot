import { chromium, Page } from 'playwright';
import { MongoDBService } from './mongodbservice';
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

                console.log(`${config.baseURL}${link}`)
            }
        }
    }


    let returnList = [];
    for (let url of urls) {
        try {
            await page.goto(url, { timeout: 60000 });
            // const paragraphsTexts = await page.$$eval(config.articleSelectors.paragraphs, (elements: HTMLElement[]) => elements.map((element: HTMLElement) => element.innerText).join("\n"));
            // const creationTime = await getText(page, config.articleSelectors.creationTime);
            // const updateTime = await getText(page, config.articleSelectors.updateTime);
            // const title = await getText(page, config.articleSelectors.title);
            // const author = await getText(page, config.articleSelectors.author);
            const dataInList: any[] = []
            const test = await page.$$eval("dl.post_offer_fields > *",
                (elements: HTMLElement[]) => {
                    return elements.map((element: HTMLElement, index) => {
                        return element.innerText
                    })
                });
            console.log(test)
            // const saveData = {
            //     title: title,
            //     content: paragraphsTexts,
            //     author: author,
            //     creationTime: creationTime,
            //     updateTime: updateTime,
            //     source: config.source,
            //     url: url
            // };
            // returnList.push(saveData);
            // const filePath = path.join(dirPath, `news-${((Date.now()) / 1000).toFixed(0)}.json`);
            // fs.writeFileSync(filePath, JSON.stringify(saveData, null, 2));
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