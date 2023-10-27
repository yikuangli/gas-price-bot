const axios = require('axios')
const jsdom = require("jsdom");


const weburl = "https://toronto.citynews.ca/wp-json/rdm-grcn/v2/pages/toronto-gta-gas-prices"
const scraper = async () => {
    return axios.get(weburl)
        .then(function (response) {
            // handle success
            // console.log(response.data);
            // console.log(response.data.content)
            const dom = new jsdom.JSDOM(response.data.content);
            const table = dom.window.document.querySelector('tbody').querySelectorAll('tr')
            let priceTable = []
            table.forEach(tr => {
                let priceRow = []
                tr.querySelectorAll("td").forEach(v => {
                    priceRow.push(v.innerHTML)
                })
                if (priceRow.length > 0) priceTable.push(priceRow)
            })
            const predict = dom.window.document.querySelector('div')
            const priceStatus = predict.querySelectorAll("[class=data-box-change] div")
            let price = priceStatus[2].textContent
            let symbol = ""
            if (priceStatus[0].style.getPropertyValue('display') === 'block') {
                symbol = ":small_red_triangle:"
            }
            if (priceStatus[1].style.getPropertyValue('display') === 'block') {
                symbol = ":small_red_triangle_down:"
            }
            let predictString = predict.textContent
            let parseList = predictString.split(" ")
            let expectIndex = parseList.indexOf("prices")
            predictString = parseList.splice(expectIndex).join(" ")
            let length1 = 0, length2 = 0, length3 = 0
            priceTable.forEach(v => {
                if (v[0].length > length1) length1 = v[0].length
                if (v[1].length > length2) length2 = v[1].length
                if (v[2].length > length3) length3 = v[2].length
            })
            let tableDisplay = "```"
            priceTable.filter((v, i) => i < 5).forEach(rawrow => {
                let row = rawrow.map(text=> text.replace(/<\/?[^>]+(>|$)/g, ""));
                let r1 = length1 - row[0].length
                let r2 = length2 - row[1].length
                let r3 = length3 - row[2].length
                let row1 = ` ${row[0]}${" ".repeat(r1)}`
                let row2 = ` | ${" ".repeat(r2)}${row[1]}`
                let row3 = ` | ${row[2]}${" ".repeat(r3)} `
                tableDisplay += `${row1}${row2}${row3}\n`
            })
            tableDisplay += "```"
            let currentDate = ""
            let parseRaw = predictString.split(" ")
            let index = parseRaw.indexOf("on")
            currentDate = `${parseRaw[index + 1]}${parseRaw[index + 2]}`
            let currentState = `${symbol === ":small_red_triangle:" ? "+" : symbol === ":small_red_triangle_down:" ? "-" : ""} ${price} Tmr`
            return [`${symbol} ${price}`, predictString, tableDisplay, currentState, currentDate]

        })
}
module.exports = { scraper }

if (require.main === module) {

    scraper().then(v => {
        console.log(v)
    })

}
