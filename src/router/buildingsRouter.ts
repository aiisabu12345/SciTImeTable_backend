import { type Context, Hono } from "hono";
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema.js";
import { HTTPException } from "hono/http-exception";
import * as V from "valibot";
import { describeRoute, resolver, validator } from "hono-openapi";

const connectionString: any = process.env.DATABASE_URL;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema, logger: true });

const buildingsRouter = new Hono();

const buildingSchema = V.object({
    id: V.number(),
    created_at: V.string(),
    updated_at: V.string(),
    code: V.string(),
    name: V.string(),
});

buildingsRouter.get(
    '/',
    describeRoute({
        description: "Fetch all building",
        responses: {
            200: {
                description: "List of departments",
                content: {
                    "application/json": { schema: resolver(V.array(buildingSchema)) },
                },
            },
        },
    }),
    async (c: Context) => {
        const data = await db
            .select()
            .from(schema.buildingsTable)
        
        return c.json(data);
    }
);

export default buildingsRouter;