const axios = require('axios')
const jsdom = require("jsdom");


const weburl = "https://www.decathlon.ca/en/c/22544/road-bikes"
const scraper = async () => {
    return axios.get(weburl)
        .then(function (response) {
            // handle success
            // console.log(response.data);
            // console.log(response.data.content)
            const dom = new jsdom.JSDOM(response.data.content);
            // console.log(dom)
            const totalNumber = dom.window.document.querySelector("[class^='CustomStats_totalItems']")
            console.log(dom.window.document)

        })
}
module.exports = { scraper }

if (require.main === module) {

    scraper().then(v => {

    })

}
