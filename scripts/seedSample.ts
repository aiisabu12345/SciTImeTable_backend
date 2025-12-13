import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema.js";

const connectionString: any = process.env.DATABASE_URL;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema, logger: true });

async function main() {
  console.log("🌱 Seeding database...");

  // ---------- Programs ----------
  const programs = await db
    .insert(schema.programsTable)
    .values([
      {
        name_th: "วิทยาการคอมพิวเตอร์",
        name_en: "Computer Science",
        num_years: 4,
        department_id: 1,
      },
      {
        name_th: "เทคโนโลยีสารสนเทศ",
        name_en: "Information Technology",
        num_years: 4,
        department_id: 1,
      },
      {
        name_th: "คณิตศาสตร์ประยุกต์",
        name_en: "Applied Mathematics",
        num_years: 4,
        department_id: 2,
      },
      {
        name_th: "เคมีอุตสาหกรรม",
        name_en: "Industrial Chemistry",
        num_years: 4,
        department_id: 3,
      },
      {
        name_th: "ฟิสิกส์ประยุกต์",
        name_en: "Applied Physics",
        num_years: 4,
        department_id: 4,
      },
    ])
    .returning();

  console.log("✔ programs seeded");

  console.log("🎉 All seed completed!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
