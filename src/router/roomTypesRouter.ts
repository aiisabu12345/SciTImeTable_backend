import { Hono } from "hono";
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema.js";
import { HTTPException } from "hono/http-exception";
import * as z from "zod";
import { describeRoute, resolver, validator } from "hono-openapi";

const connectionString: any = process.env.DATABASE_URL;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema, logger: true });

const roomTypesRouter = new Hono();

const roomtypesSchema = z.object({
    id: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
    name: z.string(),
});

roomTypesRouter.get(
    '/',
    describeRoute({
        tags: ['roomTypes'],
        description: "Fetch all room types",
        responses: {
            200: {
                description: "List of room types",
                content: {
                    "application/json": { schema: resolver(z.array(roomtypesSchema)) },
                },
            },
        },
    }),
    async (c) => {
        const data = await db
            .select()
            .from(schema.roomtypesTable)
        
        return c.json(data);
    }
);

export default roomTypesRouter;