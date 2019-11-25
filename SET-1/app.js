const axios = require("axios");
const cheerio = require("cheerio");
const async = require("async");

const {
  createArticle,
  createImage,
  createContentBlocks,
  createAuthor,
  createMetatags
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
    // console.log(`${url}`)

    (function(i) {
      let interval = setTimeout(async function() {
        if (i >= urlLength) {
          clearInterval(interval);
        }

        await processData(env, `${urls[i]}`);
      }, 5000 * 6 * 10 * i);
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
    let metaDescription;
    let tags = [];
    let description;
    let date;
    let slug;
    let headerImageBlock;

    // headerImageBlock = await genarateHeaderImage(env, $, headerImageBlock);

    $(".mag-header-img").each(async (i, ele) => {
      let image = await createImage(
        env,
        $(ele).attr("alt"),
        $(ele)
          .attr("src")
          .replace(
            "https://glidewelldental.com/wp-content/uploads/",
            "https://d2w2rzl10jt450.cloudfront.net/"
          )
      );

      headerImageBlock = {
        sys: {
          id: image.sys.id,
          linkType: "Entry",
          type: "Link"
        }
      };
    });

    $("meta").each(async (i, ele) => {
      if ($(ele).attr("property") == "og:title") {
        title = $(ele)
          .attr("content")
          .trim();
      }

      if ($(ele).attr("name") == "description") {
        const metaTags = await createMetatags(
          env,
          title,
          $(ele)
            .attr("content")
            .trim()
        );
        metaDescription = {
          sys: {
            id: metaTags.sys.id,
            linkType: "Entry",
            type: "Link"
          }
        };
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

    textBlocks = "";
    imageBlocks = "";
    async.series(
      [
        callback => {
          let inc = 0;

          $(".topofpage")
            .children(".row")
            .each(async (num_row, ele) => {
              $(ele)
                .find("p, .img-responsive, ul")
                .each(async (pi, p_ele) => {
                  if ($(p_ele).hasClass("advertise-line")) {
                    return;
                  }
                  let num_tags =
                    $(ele).find("p").length +
                    $(ele).find(".img-responsive").length;

                  (function(i) {
                    let interval = setTimeout(async function() {
                      if (inc >= num_tags) {
                        clearTimeout(interval);
                      }

                      process.stdout.write(`.`);

                      if ($(p_ele).hasClass("img-responsive")) {
                        if (textBlocks != "") {
                          let Block = await createContentBlocks(
                            env,
                            null,
                            (copy = textBlocks)
                          );

                          conentBlocks.push({
                            sys: {
                              id: Block.sys.id,
                              linkType: "Entry",
                              type: "Link"
                            }
                          });

                          textBlocks = "";
                        }

                        if ($(p_ele).hasClass(".mag-header-img")) {
                          return;
                        }

                        let imgTag = `<img src="${$(p_ele)
                          .attr("src")
                          .replace(
                            "https://glidewelldental.com/wp-content/uploads/",
                            "https://d2w2rzl10jt450.cloudfront.net/"
                          )}" alt="${$(p_ele).attr("alt")}">`;

                        let imgBlock = await createContentBlocks(
                          env,
                          null,
                          (copy = imgTag)
                        );

                        conentBlocks.push({
                          sys: {
                            id: imgBlock.sys.id,
                            linkType: "Entry",
                            type: "Link"
                          }
                        });

                        return;
                      }
                      textBlocks =
                        textBlocks +
                        ` \n ${$(p_ele)
                          .html()
                          .trim()}`;
                    }, 1200 * i);

                    inc++;
                  })(inc);
                });
            });

          callback(null);
        },

        callback => {
          setTimeout(async () => {
            // console.log(conentBlocks)

            if (textBlocks != "") {
              let Block = await createContentBlocks(
                env,
                null,
                (copy = textBlocks)
              );

              conentBlocks.push({
                sys: {
                  id: Block.sys.id,
                  linkType: "Entry",
                  type: "Link"
                }
              });

              textBlocks = "";
            }

            await generateArticle(
              title,
              env,
              slug,
              description,
              headerImageBlock,
              conentBlocks,
              metaDescription,
              date,
              tags
            );

            callback(null, "success");
          }, 4000 * 6 * 10);
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
    console.error(err.message);
  }
};

async function genarateHeaderImage(env, $, headerImageBlock) {
  if ($(".mag-header-img").attr("src") === undefined) return;
  const image = await createImage(
    env,
    $(".mag-header-img").attr("alt"),
    $(".mag-header-img").attr("src")
  );
  headerImageBlock = imageBlock = {
    sys: {
      id: image.sys.id,
      linkType: "Entry",
      type: "Link"
    }
  };
  return headerImageBlock;
}

async function generateArticle(
  title,
  env,
  slug,
  description,
  headerImageBlock,
  conentBlocks,
  metaDescription,
  date,
  tags
) {
  await createArticle(
    env,
    title,
    slug,
    description,
    headerImageBlock,
    "Article",
    conentBlocks,
    metaDescription,
    "Chairside Magazine",
    null,
    date,
    tags,
    true,
    ""
  );
}
