# gas-price-bot
Discord bot tells current gas price  and future gas price prediction scraped from internet

## RedFlagDeals forum posting

The bot checks the RedFlagDeals Hot Deals forum, remembers seen thread ids in
`redflag-seen.json`, and creates a new Discord forum post for each newly found
deal after startup warm-up.

Optional `config.json` fields:

- `redflagForumChannelId`: Discord forum channel where deal threads are created.
- `redflagErrorChannelId`: Discord text channel for scraper errors.
- `redflagCheckIntervalMs`: Poll interval. Defaults to 300000.
- `redflagStartDelayMs`: Delay after startup warm-up. Defaults to 60000.
- `redflagStateFile`: Optional path for the seen-thread state file.

The same values can be set with `REDFLAG_FORUM_CHANNEL_ID`,
`REDFLAG_ERROR_CHANNEL_ID`, `REDFLAG_CHECK_INTERVAL_MS`, and
`REDFLAG_START_DELAY_MS` environment variables on the NAS container. The state
file can also be set with `REDFLAG_STATE_FILE`.
