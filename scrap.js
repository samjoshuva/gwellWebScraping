const { createClient } = require("contentful-management");

const config = require("./config");
const client = createClient({
  accessToken: config.accessToken
});

const init = async () => {
  try {
    const space = await client.getSpace(config.spaceId);

    const env = await space.getEnvironment(config.envId);

    // const Articles = await env.getContentType("article")
    // const Image = await env.getContentType("imageLink")



    createArticle(env);

    console.log("Update was successful");


  } catch (err) {
    console.log(err);
  }
};

// init();


async function createArticle(env, title, description = null, image, contentType, contentBlocks = [], metaTags = null, source, authors = [], tags = [], featured = false, references) {

  console.log(title)

  return await env.createEntry('article', {
    fields: {
      "title": {
        'en-US': title
      },
      // "metaTags": {
      //   'en-US': metaTags
      // },
      // "authors": {
      //   'en-US': authors
      // }

      // ,
      // "description": {
      //   'en-US': description
      // },
      "image": {
        'en-US': image
      },
      "contentType": {
        "en-US": contentType
      },
      "source": {
        // "en-US": "Chairside Magazine"
        'en-US': source
      },
      "publishDate": {
        'en-US': new Date()
      },
      "tags": {
        "en-US": tags
      },
      "featured": {
        'en-US': featured
      },
      "contentBlocks": {
        'en-US': contentBlocks
      },
      "references": {
        "en-US": references
      }
    }
  });

  // console.log(article)
}

async function createImage(env, altText, link) {
  const image = await env.createEntry("imageLink", {
    fields: {
      "altText": {
        'en-US': altText
      },
      "imageUrl": {
        'en-US': link
      }
    }
  });

  return await image;
}

async function createAuthor(env, name) {
  return await env.createEntry("titleImage", {
    fields: {
      "title": {
        'en-US': name
      }
    }
  });
}

async function createContentBlocks(env, title = null, copy = null) {


  return await env.createEntry("titleCopyImageLinkCaption", {
    fields: {
      "title": {
        'en-US': title
      },
      "copy": {
        'en-US': copy
      }
    }
  });




}



module.exports = {
  createArticle,
  createImage,
  createContentBlocks,
  createAuthor
}