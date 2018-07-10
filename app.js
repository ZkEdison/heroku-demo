// function for working with aysnchronous js
let async = require('async')
let superagent  = require('superagent')
let cheerio = require('cheerio')
// url 是Node.js 标准库里面的
let url = require('url') 
let cnodeUrl = 'https://cnodejs.org/'
//service 
let express = require('express') 
const app = express()
const PORT = process.env.PORT || 5000
// l
app.get('/', (req, response, next) => {
    superagent.get(cnodeUrl)
        .then((res) => {
            let $ = cheerio.load(res.text)
            let topicUrls = []
            // 获取首页的所有链接
            $('#topic_list .topic_title').each((i, elem) => {
                let $elem = $(elem)
                let href = url.resolve(cnodeUrl, $elem.attr('href'))
                topicUrls.push(href)
            })
            let currentCount = 0
            let fetchUrl = (url, callback) => {
                currentCount++
                let start = Date.now()
                superagent.get(url)
                    .then(res => {
                        let end = Date.now()
                        console.log(`当前并非数是${currentCount}, 正在抓取的是${url}, 耗时${end - start}毫秒, 抓取成功`)
                        currentCount--
                        callback(null, [url, res.text])
                    })
                    .catch(err => {
                        let end = Date.now()
                        currentCount--
                        console.log(err)
                        // callback(null, err)
                        console.log(`当前并非数是${currentCount}, 正在抓取的是${url}, 耗时${end - start}毫秒, 抓取失败`)
                    })
            }
            
            async.mapLimit(topicUrls, 10, (url, callback) => {
                fetchUrl(url, callback)
            }, (err, result) => {
                if (err) {
                    console.log(err)
                }
                let topics = result.map(item => {
                    let url = item[0]
                    let html = item[1]
                    let $ = cheerio.load(html)
                    return ({
                        title: $('.topic_full_title').text().trim(),
                        href: url,
                        comment1: $('.reply_content').eq(0).text().trim(),
                    })
                })    
                console.log(topics)  
                response.send(topics)
            })
    
        })
        .catch((e) => {
            console.log(e)
            next(e)
        })

})


app.listen(PORT, () => {
    console.log(`app is listening at ${PORT}`)
})