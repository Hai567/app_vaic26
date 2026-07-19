import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { db } from "../db/db";
import { careers } from "../db/schema";

async function main() {
  if (!db) {
    console.error("Database connection not established. Make sure DATABASE_URL is set in .env.local.");
    process.exit(1);
  }

  const csvPath = "d:\\projects\\daFalcon_vaic_26\\dataset\\using\\careers_rows_riasec.csv";
  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvPath, "utf-8");
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`Found ${records.length} records. Updating riasec_vector...`);

  let count = 0;
  for (const record of records) {
    const id = record.id;
    let vectorStr = record.riasec_vector;
    
    if (!vectorStr) continue;

    try {
      // Vector string should be parseable as an array, e.g. "[0,2,0,0,3.5,5]"
      const vector = JSON.parse(vectorStr);
      await db.update(careers)
        .set({ riasecVector: vector })
        .where(eq(careers.id, String(id)));
      count++;
    } catch (e) {
      console.error(`Failed to parse/update vector for career id ${id}:`, e);
    }
  }

  console.log(`Successfully updated ${count} records.`);
  process.exit(0);
}

main().catch(console.error);
