const axios = require("axios");
const cheerio = require("cheerio");
const async = require("async");

const {
  createArticle,
  createImage,
  createContentBlocks,
  createAuthor,
  createMetatags,
  createContentBlocksVideos,
  createTitleCopy
} = require("../scrap");

const { createClient } = require("contentful-management");

const config = require("../config");
const client = createClient({
  accessToken: config.accessToken,
  retryOnError: true,
  timeout: 6000
});

const { urls } = require("./urls");

const init = async () => {
  const space = await client.getSpace(config.spaceId);

  const env = await space.getEnvironment(config.envId);

  let urlLength = urls.length;

  for (let inc = 0; inc <= urlLength - 1; ) {
    (function(i) {
      let interval = setTimeout(async function() {
        if (i >= urlLength) {
          clearInterval(interval);
        }

        await processData(env, `${urls[i]}`);
      }, 500 * 6 * 10 * i);
      inc++;
    })(inc);
  }
};

init();

const processData = async (env, url) => {
  try {
    let response = await axios.get(url);
    const data = response.data;
    const $ = cheerio.load(data);

    let title;
    let metaDescription = [];
    let tags = [];
    let description;
    let date;
    let slug;

    $("meta").each(async (i, ele) => {
      if ($(ele).attr("property") == "og:title") {
        title = $(ele)
          .attr("content")
          .trim();

        const metaTags = await createMetatags(env, "og:title", title);
        metaDescription.push({
          sys: {
            id: metaTags.sys.id,
            linkType: "Entry",
            type: "Link"
          }
        });
      }

      if ($(ele).attr("name") == "description") {
        const metaTags = await createMetatags(
          env,
          "description",
          $(ele)
            .attr("content")
            .trim()
        );
        metaDescription.push({
          sys: {
            id: metaTags.sys.id,
            linkType: "Entry",
            type: "Link"
          }
        });
      }

      if ($(ele).attr("property") == "article:tag") {
        tags.push(
          $(ele)
            .attr("content")
            .trim()
        );
      }
      if ($(ele).attr("property") == "article:section") {
        tags.push(
          $(ele)
            .attr("content")
            .trim()
        );
      }

      if ($(ele).attr("property") == "og:description") {
        description = $(ele)
          .attr("content")
          .trim();
      }

      if ($(ele).attr("property") == "article:published_time") {
        date = $(ele)
          .attr("content")
          .trim();
      }

      if ($(ele).attr("property") == "og:url") {
        slug = $(ele)
          .attr("content")
          .trim()
          .replace("https://glidewelldental.com/", "");
      }
    });

    let conentBlocks = [];

    process.stdout.write(`Generating article - ${title}`);

    async.series(
      [
        callback => {
          (async function() {
            let Block = await createContentBlocksVideos(
              env,
              null,
              $("iframe").attr("src"),
              $("iframe").attr("id")
            );

            conentBlocks.push({
              sys: {
                id: Block.sys.id,
                linkType: "Entry",
                type: "Link"
              }
            });

            const description = $(".video-summary");

            let textBlocks = await createTitleCopy(
              env,
              null,
              (copy = $(description).html())
            );

            conentBlocks.push({
              sys: {
                id: textBlocks.sys.id,
                linkType: "Entry",
                type: "Link"
              }
            });
          })();

          callback(null);
        },

        callback => {
          setTimeout(async () => {
            // console.log(conentBlocks)

            await generateArticle(
              env,
              title,
              slug,
              description,
              null,
              conentBlocks,
              metaDescription,
              null,
              date,
              tags,
              null
            );

            callback(null, "success");
          }, 5000);
        }
      ],
      function(err, results) {
        if (err) {
          console.log(err);
        }

        console.log(" - ", results[1]);
      }
    );
  } catch (err) {
    console.log(err.message);
  }
};

async function generateArticle(
  env,
  title,
  slug,
  description,
  headerImageBlock,
  conentBlocks,
  metaDescription,
  authors,
  date,
  tags,
  referenceBlock
) {
  await createArticle(
    env,
    title,
    slug,
    description,
    headerImageBlock,
    "Video",
    conentBlocks,
    metaDescription,
    "Chairside Live",
    authors,
    date,
    tags,
    false,
    referenceBlock
  );
}
