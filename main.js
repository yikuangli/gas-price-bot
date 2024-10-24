
const { Client, GatewayIntentBits, InteractionResponse, ThreadAutoArchiveDuration } = require('discord.js');
const { token } = require('./config.json');
const { scraper } = require('./scraper/scrape')
const { rfdeals } = require('./scraper/redflag')
const { thesource } = require('./scraper/thesource')
const { scrapeTrainInfo } = require('./scraper/gotrain')
const autoPostConfig = require('./autopost.json')
const fs = require("fs");
const rfconfig = {
    "baseURL": "https://forums.redflagdeals.com",
    "newsListURL": "/hot-deals-f9/?sk=tt&rfd_sk=tt&sd=d",
    "articleListSelector": `li.row.topic:not(.sticky):not(.deleted) ul.dropdown 
    li:first-child a:first-child`,
    "source": "Redflag Deals."
}
// Create a new client instance

const setAutoMessage = (client, clientId, delay, frequency, setTime) => {
    let currentTime = Date.now()
    if (setTime + delay < currentTime) {
        delay = frequency - (currentTime - (setTime + delay)) % frequency
    } else {
        delay = setTime + delay - currentTime
    }
    console.log(delay)

    setTimeout(() => {
        scraper().then((a) => {
            client.user.setPresence({ activities: [{ name: `${a[3]}` }], status: 'idle' });
            client.channels.cache.get(clientId).send(`${a[0]} \n${a[1]} \n ${a[2]}\n`)
        })
        setInterval(() => {
            scraper().then((a) => {
                client.user.setPresence({ activities: [{ name: `${a[3]}` }], status: 'idle' });
                client.channels.cache.get(clientId).send(`${a[0]} \n${a[1]} \n ${a[2]}\n`)
            })
        }, frequency);

    }, delay);
}



const saveAutopost = (clientId, delay, frequency, setTime) => {
    autoPostConfig[clientId] = {
        delay: delay,
        frequency: frequency,
        setTime: setTime
    }
    let configString = JSON.stringify(autoPostConfig, null, 2);
    fs.writeFile('autopost.json', configString, (err) => {
        if (err) throw err;
        console.log('Data written to file');
    });
}




const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const rdDealsCheck = async () => {
    try {
        let formId = "1177093758853054624"
        let posts = await rfdeals(rfconfig);
        if (posts.length > 0) {
            await client.channels.fetch(formId).then(async channel => {
                for (let post of posts) {
                    await channel.threads.create({
                        name: post.title,
                        autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
                        message: {
                            content: post.content,
                        },
                        reason: '',
                    }).catch(console.error);
                }
            })
        }
    } catch (e) {
        console.log(e)
        await client.channels.fetch("1177446494509477908").then(channel => {
            channel.send(`error on rdflag`)
            // channel.send(e)
        })
    }
    setTimeout(rdDealsCheck, 400 * 1000)

}
var clearPriceItemCount

const gotrainCheck = async () => {
    try {
        let info = await scrapeTrainInfo(true)
        if (info.length > 0) {
            await client.channels.fetch("1298505394574065726").then(channel => {
                let message = "```";
                for (let train of info) {
                    message += `${train.departureStopsDisplay}  |  ${train.scheduledTime}  | ${train.platform}  | ${train.status}\n`
                }
                message += "``` \n <@650752284380233734>"
                channel.send(message)

            })
        }
    } catch (e) {
        console.log(e)
    }
}
const thesourceCheck = async () => {
    try {
        let stockList = await thesource()
        if (stockList.error) {
            await client.channels.fetch("1177446494509477908").then(channel => {
                // Send the top 1000 characters of the error string
                const errorMessage = stockList.error.toString().substring(0, 1000);
                channel.send(`Error from The Source (first 1000 characters):\n\`\`\`${errorMessage}\`\`\``);
                // channel.send(stockList.error)
            })
        } else if (stockList.length > 0) {
            await client.channels.fetch("843244697577062414").then(channel => {

                let message = "```";
                for (let stock of stockList) {
                    message += `${stock.price}  |  ${stock.name}  | ${stock.stock}\n`
                }
                message += "```"
                if (clearPriceItemCount !== stockList.length) {
                    message += "\n <@650752284380233734>"
                    channel.send(message)
                }

                // channel.send(e)
            })
        }
        clearPriceItemCount = stockList.length
    } catch (e) {
        await client.channels.fetch("1177446494509477908").then(channel => {
            const errorMessage = e.toString().substring(0, 1000);
            channel.send(`Error from The Source (first 1000 characters):\n\`\`\`${errorMessage}\`\`\``);
            // channel.send(`error on thesource`)
            // channel.send(e)
        })
    }
    setTimeout(thesourceCheck, 310 * 1000)
}

// When the client is ready, run this code (only once)
client.once('ready', async () => {
    let a = await scraper()
    client.user.setPresence({ activities: [{ name: `${a[3]}` }], status: 'idle' });
    lastCheckDate = ""
    testconfig = {
        "996191372723896473": "as",
        "843244697577062414": 'b'
    }
    for (channelId in testconfig) {
        client.channels.fetch(channelId).then(channel => {
            channel.send(`${a[0]} \n${a[1]} \n ${a[2]}\n`)
        })
    }
    setInterval(async () => {
        let a = await scraper()
        client.user.setPresence({ activities: [{ name: `${a[3]}` }], status: 'idle' });
        if (a[4] !== lastCheckDate && lastCheckDate.length !== 0) {
            for (channelId in autoPostConfig) {
                client.channels.fetch(channelId).then(channel => {
                    channel.send(`${a[0]} \n${a[1]} \n ${a[2]}\n`)
                })
            }
        }
        lastCheckDate = a[4]
    }, 900 * 1000);
    await rfdeals(rfconfig, true);
    setInterval(gotrainCheck, 4 * 60 * 1000);
    setTimeout(rdDealsCheck, 300 * 1000);
    // setTimeout(thesourceCheck, 30 * 1000);
    
    // for (channelId in autoPostConfig) {
    //     setAutoMessage(
    //         client,
    //         channelId,
    //         autoPostConfig[channelId].delay,
    //         autoPostConfig[channelId].frequency,
    //         autoPostConfig[channelId].setTime)
    // }
});

client.on('interactionCreate', async interaction => {
    console.log(interaction.channelId)
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ping') {
        await interaction.reply({ content: 'Success!', ephemeral: true });
    } else if (commandName === 'server') {
        console.log(interaction)
        await interaction.reply(`Server name: ${interaction.guild.name} ${interaction.channelId}\nTotal members: ${interaction.guild.memberCount}`);
    } else if (commandName === 'user') {
        await interaction.reply('User info.');
    } else if (commandName === 'gasinfo') {
        let a = await scraper()
        client.user.setPresence({ activities: [{ name: `${a[3]}` }], status: 'idle' });
        await interaction.reply(`${a[0]} \n${a[1]} ${a[2]}\n`);
    } else if (commandName === 'setautopost') {
        let frequency = interaction.options.getNumber('frequency');
        let delay = interaction.options.getNumber('delay');
        frequency = frequency * 3600000
        delay = delay * 3600000
        const channelInfo = interaction.channelId
        saveAutopost(channelInfo, delay, frequency, Date.now())
        setAutoMessage(client, channelInfo, delay, frequency, Date.now())
        await interaction.reply({ content: 'Success!', ephemeral: true })
        // await interaction.reply();

    }
});

// Login to Discord with your client's token
client.login(token);
