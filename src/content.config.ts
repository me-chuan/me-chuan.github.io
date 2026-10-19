import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * 博客文章集合。
 * 新增文章 = 在 src/content/blog/ 下放一个 .md 文件，schema 会在构建期校验 frontmatter。
 */
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string().max(80),
    description: z.string().max(200),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/**
 * 项目展示集合。
 * 新增项目 = 在 src/content/projects/ 下放一个 .md 文件。
 */
const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(200),
    startDate: z.coerce.date().optional(),
    repo: z.url().optional(),
    demo: z.url().optional(),
    tech: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    order: z.number().default(99),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, projects };
