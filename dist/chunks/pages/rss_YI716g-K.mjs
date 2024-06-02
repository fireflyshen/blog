import rss from '@astrojs/rss';
import { g as getCollection, d as getSortedPosts } from './_page__fakqKCtu.mjs';
import { S as SITE } from './404_KhQamH6Z.mjs';

async function GET() {
  const posts = await getCollection("blog");
  const sortedPosts = getSortedPosts(posts);
  return rss({
    title: SITE.title,
    description: SITE.desc,
    site: SITE.website,
    items: sortedPosts.map(({ data, slug }) => ({
      link: `posts/${slug}/`,
      title: data.title,
      description: data.description,
      pubDate: new Date(data.modDatetime ?? data.pubDatetime)
    }))
  });
}

export { GET };
