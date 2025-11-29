import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema.js";

const connectionString: any = process.env.DATABASE_URL;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema, logger: true });

async function main() {
    await db.insert(schema.buildingsTable).values([
        { code: "SC01", name: "อาคารสำนักคณบดี"},
        { code: "SC02", name: "อาคารวิทยาศาสตร์ 2" },
        { code: "SC03", name: "อาคารฝึกงานเคมีอุตสาหกรรมและพอลิเมอร์" },
        { code: "SC04", name: "อาคารจุฬาภรณวลัยลักษณ์ 1" },
        { code: "SC05", name: "หอประชุมจุฬาภรณวลัยลักษณ์" },
        { code: "SC06", name: "อาคารจุฬาภรณวลัยลักษณ์ 2" },
        { code: "SC07", name: "อาคารวิทยรังสรรค์" },
        { code: "SC08", name: "อาคารพระจอมเกล้า" },
    ])

    await db.insert(schema.roomtypesTable).values([
        {name:"ห้องบรรยาย"},
        {name:"ห้องปฏิบัติการคอมพิวเตอร์"},
        {name:"ห้องปฏิบัติการวิทยาศาสตร์"},
        {name:"อื่นๆ"},
    ])
    process.exit(0);
}

main();