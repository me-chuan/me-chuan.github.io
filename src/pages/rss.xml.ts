import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../data/site.config';
import { sitePath } from '../data/site-path';

export async function GET(context: { site?: URL }) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  return rss({
    title: `${SITE.title} · ${SITE.tagline}`,
    description: SITE.description,
    site: new URL(sitePath('/'), context.site ?? SITE.url),
    customData: `<language>${SITE.lang}</language>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: new URL(sitePath(`/blog/${post.id}/`), context.site ?? SITE.url).href,
      categories: post.data.tags,
    })),
  });
}
