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

const buildingsRouter = new Hono();

const buildingSchema = z.object({
    id: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    name_en: z.string(),
    name_th: z.string(),
});

buildingsRouter.get(
    '/',
    describeRoute({
        tags: ['buildings'],
        description: "Fetch all building",
        responses: {
            200: {
                description: "List of departments",
                content: {
                    "application/json": { schema: resolver(z.array(buildingSchema)) },
                },
            },
        },
    }),
    async (c) => {
        const data = await db
            .select()
            .from(schema.buildingsTable)
        
        return c.json(data);
    }
);

export default buildingsRouter;