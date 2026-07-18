/**
 * Manual migration runner - bypasses drizzle-kit push's introspection issue
 * Run with: npx tsx run-migration.ts
 */

import { config as loadEnv } from "dotenv";
import postgres from "postgres";
import * as fs from "fs";

loadEnv({ path: ".env.local" });

async function runMigration() {
	const connectionString = process.env.DATABASE_URL;

	if (!connectionString) {
		console.error("❌ DATABASE_URL not set in .env.local");
		process.exit(1);
	}

	const client = postgres(connectionString, { prepare: false });

	try {
		console.log("🔄 Running GDPT 2018 migration...");
		console.log(`📡 Connected to database`);

		// Read the generated migration file
		const migrationSQL = fs.readFileSync(
			"./drizzle/0000_fantastic_glorian.sql",
			"utf-8",
		);

		// Split by statement breakpoint and execute each statement
		const statements = migrationSQL
			.split("--> statement-breakpoint")
			.map((s) => s.trim())
			.filter(Boolean);

		console.log(`Found ${statements.length} migration statements\n`);

		for (let i = 0; i < statements.length; i++) {
			const statement = statements[i];
			if (statement) {
				const preview = statement.substring(0, 60).replace(/\n/g, " ");
				console.log(
					`[${i + 1}/${statements.length}] Executing: ${preview}...`,
				);
				try {
					await client.unsafe(statement);
					console.log("    ✅ Done\n");
				} catch (err: any) {
					if (err.message?.includes("already exists")) {
						console.log("    ⚠️  Already exists (skipping)\n");
					} else {
						throw err;
					}
				}
			}
		}

		console.log("✨ Migration completed successfully!");
		await client.end();
		process.exit(0);
	} catch (error) {
		console.error("❌ Migration failed:", error);
		await client.end();
		process.exit(1);
	}
}

runMigration();
