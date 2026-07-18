/**
 * Helper: Generate embeddings for education_guidelines using OpenRouter (via OpenAI SDK)
 * Run with: npx tsx src/db/embed-education-guidelines.ts
 *
 * Uses OpenRouter with OpenAI API compatibility.
 * Requires: OPENROUTER_API_KEY environment variable
 */

import { config as loadEnv } from "dotenv";

// Load environment variables BEFORE other imports
loadEnv({ path: ".env.local" });

import OpenAI from "openai";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

const client = new OpenAI({
	apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
	baseURL: "https://openrouter.ai/api/v1",
});

async function generateEmbeddings() {
	const connectionString = process.env.DATABASE_URL;

	if (!connectionString) {
		console.error("❌ DATABASE_URL not set in .env.local");
		process.exit(1);
	}

	if (!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
		console.error(
			"❌ OPENROUTER_API_KEY or OPENAI_API_KEY not set in .env.local",
		);
		process.exit(1);
	}

	const pgClient = postgres(connectionString, { prepare: false });
	const db = drizzle(pgClient, { schema });

	try {
		console.log("🔄 Generating embeddings for education guidelines...");

		// Fetch all guidelines
		const allGuidelines = await db
			.select()
			.from(schema.educationGuidelines);

		// Filter ones without embeddings
		const guidelinesToEmbed = allGuidelines.filter(
			(g: Record<string, unknown>) => !g.embedding,
		);

		if (guidelinesToEmbed.length === 0) {
			console.log("✅ All guidelines already have embeddings!");
			await pgClient.end();
			process.exit(0);
		}

		console.log(`Found ${guidelinesToEmbed.length} guidelines to embed\n`);

		for (let i = 0; i < guidelinesToEmbed.length; i++) {
			const guideline = guidelinesToEmbed[i];
			try {
				// Generate embedding
				const response = await client.embeddings.create({
					model: "text-embedding-3-small",
					input: `${guideline.topic}\n${guideline.content}`,
					dimensions: 1536,
				});

				const embedding = response.data[0].embedding as number[];

				// Update guideline with embedding
				await db
					.update(schema.educationGuidelines)
					.set({ embedding: embedding })
					.where(
						eq(
							schema.educationGuidelines.id,
							guideline.id as string,
						),
					);

				console.log(
					`[${i + 1}/${guidelinesToEmbed.length}] ✅ Embedded: ${guideline.topic}`,
				);

				// Small delay to avoid rate limiting
				await new Promise((resolve) => setTimeout(resolve, 100));
			} catch (error) {
				console.error(
					`[${i + 1}/${guidelinesToEmbed.length}] ❌ Failed to embed ${guideline.topic}:`,
					error,
				);
			}
		}

		console.log("\n✨ Embedding generation completed!");
		await pgClient.end();
		process.exit(0);
	} catch (error) {
		console.error("❌ Embedding generation failed:", error);
		await pgClient.end();
		process.exit(1);
	}
}

generateEmbeddings();
