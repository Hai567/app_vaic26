import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	console.warn(
		"DATABASE_URL not set. Database operations will use mock data.",
	);
}

const client = connectionString
	? postgres(connectionString, { prepare: false })
	: null;

export const db = client ? drizzle(client, { schema }) : null;
