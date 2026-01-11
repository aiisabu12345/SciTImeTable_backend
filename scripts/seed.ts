import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema.js";
import rooms from "./rooms.json" with {type:'json'};

const connectionString: any = process.env.DATABASE_URL;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema, logger: true });

async function main() {
  await db.insert(schema.buildingsTable).values([
    { id: "SC01", name_en: "SC01", name_th: "อาคารสำนักคณบดี" },
    { id: "SC02", name_en: "SC02", name_th: "อาคารวิทยาศาสตร์ 2" },
    {
      id: "SC03",
      name_en: "SC03",
      name_th: "อาคารฝึกงานเคมีอุตสาหกรรมและพอลิเมอร์",
    },
    { id: "SC04", name_en: "SC04", name_th: "อาคารจุฬาภรณวลัยลักษณ์ 1" },
    { id: "SC05", name_en: "SC05", name_th: "หอประชุมจุฬาภรณวลัยลักษณ์" },
    { id: "SC06", name_en: "SC06", name_th: "อาคารจุฬาภรณวลัยลักษณ์ 2" },
    { id: "SC07", name_en: "SC07", name_th: "อาคารวิทยรังสรรค์" },
    { id: "SC08", name_en: "SC08", name_th: "อาคารพระจอมเกล้า" },
  ]);

  const room_types = await db
    .insert(schema.roomtypesTable)
    .values([
      { name: "ห้องประชุม" },
      { name: "ห้องบรรยาย" },
      { name: "ห้องปฏิบัติการคอมพิวเตอร์" },
      { name: "ห้องปฏิบัติการวิทยาศาสตร์" },
      { name: "อื่นๆ" },
    ])
    .returning();

  await db.insert(schema.departmentsTable).values([
    {
      code: "idk0",
      name_th: "ส่วนกลางคณะ",
      name_en: "Science Centre",
    },
    {
      code: "idk1",
      name_th: "ภาควิชาเคมี",
      name_en: "Department of Chemistry",
    },
    {
      code: "idk2",
      name_th: "ภาควิชาคณิตศาสตร์",
      name_en: "Department of Mathematics",
    },
    {
      code: "idk3",
      name_th: "ภาควิชาฟิสิกส์",
      name_en: "Department of Physics",
    },
    {
      code: "idk4",
      name_th: "ภาควิชาชีววิทยา",
      name_en: "Department of Biology",
    },
    {
      code: "idk5",
      name_th: "ภาควิชาวิทยาการคอมพิวเตอร์",
      name_en: "Department of Computer Science",
    },
    {
      code: "idk6",
      name_th: "ภาควิชาสถิติ",
      name_en: "Department of Statistics",
    },
    {
      code: "idk7",
      name_th: "ศูนย์เครื่องมือวิทยาศาสตร์",
      name_en: "Scientific Instruments Center",
    },
    {
      code: "idk8",
      name_th: "ศูนย์วิเคราะห์ข้อมูลอัจฉริยะ",
      name_en: "KMITL Digital Analytics and Intelligence Center (KDAI)",
    },
  ]);

  interface roomsType {
    id: string;
    type: string;
    name: string;
    capacity: number;
    building_id: string;
  }
  const roomsData:roomsType[] = [];
  rooms.data.map( item => {
    const row:roomsType = {
        id: item.id,
        type: room_types[item.room_type_id - 1].name,
        name: item.name,
        capacity: item.capacity,
        building_id: item.building_id
    }

    roomsData.push(row)
  })

  await db.insert(schema.roomsTable).values(roomsData)

  process.exit(0);
}

main();
