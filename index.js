const axios = require('axios');
const cheerio = require('cheerio')
const {
    createArticle,
    createImage,
    createContentBlocks,
    createAuthor
} = require('./scrap');

const { createClient } = require("contentful-management");

const config = require("./config");
const client = createClient({
    accessToken: config.accessToken
});

const fs = require('fs');
const csv = require('csv-parser');

const { urls } = require('./urls');

function prepareUrls() {

    fs.createReadStream('urls.csv')
        .pipe(csv()).on('data', row => {
            console.log(row);
        })
        .on('end', () => {
            console.log('CSV file successfully processed');
        });

}



const init = async () => {

    const space = await client.getSpace(config.spaceId);

    const env = await space.getEnvironment(config.envId);
    // prepareUrls()
    // processData(env, 'https://glidewelldental.com/education/chairside-dental-magazine/volume-14-issue-3/letter-readers')

    // console.log(urls)
    // urls.forEach(url => {
    //     console.log(url.toString())
    //     processData(env, url.toString())
    // })

    for(let url of urls) {
        // console.log(`${url}`)
        processData(env, `${url}`)
    }


}

init()


const processData = async (env, url) => {
    axios.get(url)
        .then(async function (response) {

            const data = response.data
            const $ = cheerio.load(data)
            let title = $('h1').text()
            let image = $(".mag-header-img")

            console.log(image.html())



            image = await createImage(env, image.attr('alt'), image.attr('src'))

            let imageBlock = {
                sys: {
                    id: image.sys.id,
                    linkType: 'Entry',
                    type: 'Link'
                }
            }

            let conentBlocks = [];

            process.stdout.write("Generating content blocks")
            $(".content-block").each(async (i, ele) => {
                process.stdout.write(".")
                // console.log($(ele).html())

                let Block = await createContentBlocks(env, null, copy = $(ele).html().trim())
                conentBlocks.push(
                    {
                        sys: {
                            id: Block.sys.id,
                            linkType: 'Entry',
                            type: 'Link'
                        }
                    }
                )
            })
            process.stdout.write("\n Generating content blocks for image")

            $(`[class^="mag-img"]`).each(async (i, ele) => {

                console.log($(ele).attr('src'))

                if ($(ele).attr('src') == undefined) return

                // return

                let imgTag = `<img src="${$(ele).attr('src')}" alt="${$(ele).attr('alt')}">`
                let Block = await createContentBlocks(env, null, copy = imgTag)
                conentBlocks.push(
                    {
                        sys: {
                            id: Block.sys.id,
                            linkType: 'Entry',
                            type: 'Link'
                        }
                    }
                )
            })


            process.stdout.write("Generating content blocks")
            $(".content-block").each(async (i, ele) => {
                process.stdout.write(".")
                // console.log($(ele).html())

                let Block = await createContentBlocks(env, null, copy = $(ele).html().trim())
                conentBlocks.push(
                    {
                        sys: {
                            id: Block.sys.id,
                            linkType: 'Entry',
                            type: 'Link'
                        }
                    }
                )
            })
            
            // return

            setTimeout(async () => {
                console.log("conentBlocks", conentBlocks)
                process.stdout.write("Generating Article")

                let article = await createArticle(env, title, null, imageBlock, "Article", conentBlocks, null, "Chairside Magazine", null, null, true, "")


                console.log(article)


            }, 6000)

        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })
}