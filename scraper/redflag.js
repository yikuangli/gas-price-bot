const axios = require("axios");
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

// https://forums.redflagdeals.com/hot-deals-f9/?sk=tt&rfd_sk=tt&sd=d
const defaultConfig = {
    baseURL: "https://forums.redflagdeals.com",
    newsListURL: "/hot-deals-f9/?sk=tt&rfd_sk=tt&sd=d",
    source: "RedFlagDeals",
    stateFile: path.join(__dirname, "..", "redflag-seen.json"),
    maxSeenItems: 200,
};

let seenThreadIds = null;

function normalizeText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
}

function absoluteUrl(baseURL, href) {
    return new URL(href, baseURL).toString();
}

function getText(root, selector) {
    const element = root.querySelector(selector);
    return element ? normalizeText(element.textContent) : "";
}

function getStat(root, selector) {
    const text = getText(root, selector);
    const match = text.match(/-?\d[\d,]*/);
    return match ? match[0] : "";
}

function extractThreadId(card, link) {
    const fromCard = card.getAttribute("data-thread-id");
    const fromLink = link && link.getAttribute("data-thread-id");
    const href = link && link.getAttribute("href");
    const fromHref = href && href.match(/-(\d+)\/?(?:[#?].*)?$/);

    return fromCard || fromLink || (fromHref && fromHref[1]) || "";
}

function readSeenThreadIds(config) {
    if (seenThreadIds) return seenThreadIds;

    try {
        const raw = fs.readFileSync(config.stateFile, "utf8");
        const parsed = JSON.parse(raw);
        seenThreadIds = Array.isArray(parsed.threadIds) ? parsed.threadIds : [];
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.warn(`Could not read RedFlagDeals state file: ${error.message}`);
        }
        seenThreadIds = [];
    }

    return seenThreadIds;
}

function writeSeenThreadIds(config) {
    if (!config.stateFile) return;

    const state = {
        updatedAt: new Date().toISOString(),
        threadIds: seenThreadIds,
    };
    fs.mkdirSync(path.dirname(config.stateFile), { recursive: true });
    fs.writeFileSync(config.stateFile, JSON.stringify(state, null, 2));
}

function rememberThreadId(config, threadId) {
    if (!threadId) return;

    readSeenThreadIds(config);
    seenThreadIds = seenThreadIds.filter(id => id !== threadId);
    seenThreadIds.unshift(threadId);
    seenThreadIds = seenThreadIds.slice(0, config.maxSeenItems);
}

function parseDealsFromHtml(html, config = defaultConfig) {
    const document = new JSDOM(html).window.document;
    const cards = [...document.querySelectorAll("li.topic-card.topic:not(.deleted)")];

    if (cards.length === 0) {
        throw new Error("RedFlagDeals parser found no deal cards. The forum markup may have changed again.");
    }

    return cards
        .map(card => {
            const link = card.querySelector("a.topic-card-info[href]");
            const title = getText(card, "h3.thread_title");
            const threadId = link ? extractThreadId(card, link) : "";

            if (!link || !title || !threadId) return null;

            const retailerText = getText(card, ".dealer_name");
            const retailer = retailerText === "Retailer Unlisted" ? "" : retailerText;
            const timeElement = card.querySelector("time.topic_time");
            const imageElement = card.querySelector(".thread_image img[src]");
            const savings = getText(card, ".savings");

            return {
                threadId,
                title,
                url: absoluteUrl(config.baseURL, link.getAttribute("href")),
                retailer,
                postedAt: timeElement ? timeElement.getAttribute("datetime") || "" : "",
                postedAtText: timeElement ? normalizeText(timeElement.textContent) : "",
                votes: getStat(card, ".votes.thread_stat"),
                replies: getStat(card, ".posts.thread_stat"),
                savings,
                imageUrl: imageElement ? absoluteUrl(config.baseURL, imageElement.getAttribute("src")) : "",
            };
        })
        .filter(Boolean);
}

function buildDiscordPost(item) {
    const lines = [
        `**${item.title}**`,
        item.retailer ? `Retailer: ${item.retailer}` : "",
        item.savings ? `Price: ${item.savings}` : "",
        item.postedAtText ? `Posted: ${item.postedAtText}` : "",
        item.votes ? `Votes: ${item.votes}` : "",
        item.replies ? `Replies: ${item.replies}` : "",
        item.url,
    ].filter(Boolean);

    return {
        title: item.title,
        content: lines.join("\n").slice(0, 1900),
        threadId: item.threadId,
        url: item.url,
    };
}

async function rfdeals(rawConfig = {}, init = false) {
    const configOverrides = Object.fromEntries(
        Object.entries(rawConfig).filter(([, value]) => value !== undefined)
    );
    const config = { ...defaultConfig, ...configOverrides };
    const targetURL = absoluteUrl(config.baseURL, config.newsListURL);
    const response = await axios.get(targetURL, {
        timeout: config.timeout || 20000,
        headers: {
            "User-Agent": config.userAgent || "Mozilla/5.0 (compatible; gas-price-bot/1.0)",
            "Accept-Language": "en-CA,en;q=0.9",
        },
    });

    const deals = parseDealsFromHtml(response.data, config);
    const seen = readSeenThreadIds(config);
    const newDeals = deals.filter(item => !seen.includes(item.threadId));

    for (const item of newDeals) {
        rememberThreadId(config, item.threadId);
    }
    writeSeenThreadIds(config);

    if (init) {
        console.log(`RedFlagDeals initialized with ${deals.length} current deals.`);
        return [];
    }

    return newDeals.map(buildDiscordPost);
}

module.exports = { rfdeals, parseDealsFromHtml };

if (require.main === module) {
    (async () => {
        const init = process.argv.includes("--init");
        const items = await rfdeals(defaultConfig, init);
        console.log(JSON.stringify(items.slice(0, 5), null, 2));
    })().catch(error => {
        console.error("Error during RedFlagDeals scrape:", error);
        process.exit(1);
    });
}
