import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema.js";

const connectionString: any = process.env.DATABASE_URL;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema, logger: true });

async function main() {
  console.log("🌱 Seeding database...");

  // ---------- Departments ----------
  const departments = await db
    .insert(schema.departmentsTable)
    .values([
      { name_th: "วิทยาการคอมพิวเตอร์", name_en: "Computer Science" },
      { name_th: "คณิตศาสตร์", name_en: "Mathematics" },
      { name_th: "เคมี", name_en: "Chemistry" },
      { name_th: "ฟิสิกส์", name_en: "Physics" },
    ])
    .returning();

  console.log("✔ departments seeded");

  // ---------- Programs ----------
  const programs = await db
    .insert(schema.programsTable)
    .values([
      {
        name_th: "วิทยาการคอมพิวเตอร์",
        name_en: "Computer Science",
        num_years: 4,
        department_id: departments[0].id,
      },
      {
        name_th: "เทคโนโลยีสารสนเทศ",
        name_en: "Information Technology",
        num_years: 4,
        department_id: departments[0].id,
      },
      {
        name_th: "คณิตศาสตร์ประยุกต์",
        name_en: "Applied Mathematics",
        num_years: 4,
        department_id: departments[1].id,
      },
      {
        name_th: "เคมีอุตสาหกรรม",
        name_en: "Industrial Chemistry",
        num_years: 4,
        department_id: departments[2].id,
      },
      {
        name_th: "ฟิสิกส์ประยุกต์",
        name_en: "Applied Physics",
        num_years: 4,
        department_id: departments[3].id,
      },
    ])
    .returning();

  console.log("✔ programs seeded");

  // ---------- Rooms ----------
  await db.insert(schema.roomsTable).values([
    {
      name: "SC01-101",
      type: "ห้องบรรยาย",
      capacity: 80,
      building_id: 1,
    },
    {
      name: "SC01-201",
      type: "ห้องประชุม",
      capacity: 50,
      building_id: 1,
    },
    {
      name: "SC02-301",
      type: "ห้องปฏิบัติการคอมพิวเตอร์",
      capacity: 45,
      building_id: 2,
    },
    {
      name: "SC03-104",
      type: "ห้องปฏิบัติการวิทยาศาสตร์",
      capacity: 30,
      building_id: 3,
    },
    {
      name: "SC04-210",
      type: "ห้องบรรยาย",
      capacity: 120,
      building_id: 4,
    },
    {
      name: "SC05-Hall",
      type: "อื่นๆ",
      capacity: 500,
      building_id: 5,
    },
  ]);

  console.log("✔ rooms seeded");

  console.log("🎉 All seed completed!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
