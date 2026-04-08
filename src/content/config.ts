import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		description: z.string(),
		// Transform string to Date object
		date: z.coerce.date(),
		lastUpdated: z.coerce.date().optional(),
		category: z.enum(['guides', 'benchmarks', 'tutorials', 'comparisons', 'changelog']),
		tags: z.array(z.string()).optional(),
		author: z.string().default('ShinyMetal Team'),
		ogImage: z.string().optional(),
	}),
});

export const collections = { blog };
