import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema.js";

const connectionString: any = process.env.DATABASE_URL;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema, logger: true });

async function main() {
    await db.insert(schema.buildingsTable).values([
        { code: "SC01", name: "อาคารสำนักคณบดี", updated_at: new Date() },
        { code: "SC02", name: "อาคารวิทยาศาสตร์ 2", updated_at: new Date() },
        { code: "SC03", name: "อาคารฝึกงานเคมีอุตสาหกรรมและพอลิเมอร์", updated_at: new Date() },
        { code: "SC04", name: "อาคารจุฬาภรณวลัยลักษณ์ 1", updated_at: new Date() },
        { code: "SC05", name: "หอประชุมจุฬาภรณวลัยลักษณ์", updated_at: new Date() },
        { code: "SC06", name: "อาคารจุฬาภรณวลัยลักษณ์ 2", updated_at: new Date() },
        { code: "SC07", name: "อาคารวิทยรังสรรค์", updated_at: new Date() },
        { code: "SC08", name: "อาคารพระจอมเกล้า", updated_at: new Date() },
    ])

    await db.insert(schema.roomtypesTable).values([
        {name:"ห้องบรรยาย",updated_at:new Date()},
        {name:"ห้องปฏิบัติการคอมพิวเตอร์",updated_at:new Date()},
        {name:"ห้องปฏิบัติการวิทยาศาสตร์",updated_at:new Date()},
        {name:"อื่นๆ",updated_at:new Date()},
    ])
    process.exit(0);
}

main();