import { Hono } from "hono";
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema.js";
import { HTTPException } from "hono/http-exception";
import * as z from "zod";
import { describeRoute, resolver, validator } from "hono-openapi";
import { eq, and, ne, or, sql, desc, asc } from "drizzle-orm";
import { message } from "valibot";

const connectionString: any = process.env.DATABASE_URL;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema, logger: true });

const departmentsRouter = new Hono();

const departmentSchema = z.object({
  id: z.number(),
  name_th: z.string(),
  name_en: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  code: z.string(),
});

const querySchema = z.object({
  limit: z.string().default("10").optional(),
  page: z.string().default("1").optional(),
});

const searchQuerySchema = z.object({
  q: z.string().default("").optional(),
  limit: z.string().default("10").optional(),
  page: z.string().default("1").optional(),
});

const inputDepartmentSchema = departmentSchema.pick({
  name_th: true,
  name_en: true,
  code: true,
});

const inputDepartmentValidator = validator("json", inputDepartmentSchema);

departmentsRouter.get(
  "/",
  describeRoute({
    tags: ["departments"],
    description: "Fetch all departments",
    responses: {
      200: {
        description: "List of departments",
        content: {
          "application/json": { schema: resolver(z.array(departmentSchema)) },
        },
      },
    },
  }),
  validator("query", querySchema),
  async (c) => {
    const limit = Number(c.req.query("limit") ?? 10);
    const page = Number(c.req.query("page") ?? 1);

    const offset = (page - 1) * limit;

    const data = await db
      .select()
      .from(schema.departmentsTable)
      .orderBy(desc(schema.departmentsTable.created_at))
      .limit(limit)
      .offset(offset);

    return c.json(data);
  },
);

departmentsRouter.get(
  "/search",
  describeRoute({
    tags: ["departments"],
    description: "Fetch departments with search",
    responses: {
      200: {
        description: "List of departments",
        content: {
          "application/json": { schema: resolver(z.array(departmentSchema)) },
        },
      },
    },
  }),
  validator("query", searchQuerySchema),
  async (c) => {
    const limit = Number(c.req.query("limit") ?? 10);
    const page = Number(c.req.query("page") ?? 1);

    const offset = (page - 1) * limit;

    const q = c.req.query("q") ?? "";
    const data = await db
      .select()
      .from(schema.departmentsTable)
      .where(
        sql`
          similarity(${schema.departmentsTable.name_th}, ${q}) > 0.1 OR
          similarity(${schema.departmentsTable.name_en}, ${q}) > 0.1
          
        `,
      )
      .orderBy(
        sql`
        GREATEST(
          similarity(${schema.departmentsTable.name_th}, ${q}::text),
          similarity(${schema.departmentsTable.name_en}, ${q}::text)
        ) DESC
      `,
      )
      .limit(limit)
      .offset(offset);

    return c.json(data);
  },
);

departmentsRouter.post(
  "/",
  describeRoute({
    tags: ["departments"],
    description: "add department",
    responses: {
      200: {
        description: "added department",
        content: {
          "application/json": {
            schema: resolver(z.object({ message: z.string() })),
          },
        },
      },
      400: {
        description: "Duplicate department",
        content: {
          "application/json": {
            schema: resolver(z.object({ message: z.string() })),
          },
        },
      },
    },
  }),
  inputDepartmentValidator,
  async (c) => {
    const data = await c.req.valid("json");
    const [exists] = await db
      .select()
      .from(schema.departmentsTable)
      .where(
        or(
          eq(schema.departmentsTable.name_en, data.name_en),
          eq(schema.departmentsTable.name_th, data.name_th),
          eq(schema.departmentsTable.code, data.code),
        ),
      );

    if (exists)
      throw new HTTPException(400, { message: "department already exists" });
    await db.insert(schema.departmentsTable).values({
      name_th: data.name_th,
      name_en: data.name_en,
      code: data.code,
    });
    return c.json({ message: "added successfully" });
  },
);

departmentsRouter.put(
  "/:id",
  describeRoute({
    tags: ["departments"],
    description: "edit department",
    responses: {
      200: {
        description: "edited department",
        content: {
          "application/json": {
            schema: resolver(z.object({ message: z.string() })),
          },
        },
      },
      404: {
        description: "not found department",
        content: {
          "application/json": {
            schema: resolver(z.object({ message: z.string() })),
          },
        },
      },
    },
  }),
  inputDepartmentValidator,
  async (c) => {
    const id = Number(c.req.param("id"));
    const data = await c.req.valid("json");
    const { name_th, name_en, code } = data;

    const [exists] = await db
      .select()
      .from(schema.departmentsTable)
      .where(eq(schema.departmentsTable.id, id))
      .limit(1);
    if (!exists)
      throw new HTTPException(404, { message: "department not found" });

    const updated = await db
      .update(schema.departmentsTable)
      .set({
        name_th,
        name_en,
        code,
      })
      .where(eq(schema.departmentsTable.id, id))
      .returning();

    return c.json({ message: "Department updated", department: updated });
  },
);

departmentsRouter.delete(
  "/:id",
  describeRoute({
    tags: ["departments"],
    description: "delete department",
    responses: {
      200: {
        description: "department deleted",
        content: {
          "application/json": {
            schema: resolver(z.object({ message: z.string() })),
          },
        },
      },
      404: {
        description: "not found department",
        content: {
          "application/json": {
            schema: resolver(z.object({ message: z.string() })),
          },
        },
      },
    },
  }),
  async (c) => {
    const id = Number(c.req.param("id"));

    const result = await db
      .delete(schema.departmentsTable)
      .where(eq(schema.departmentsTable.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: "Department not found" }, 404);
    }
    return c.json({
      message: "Deleted successfully",
      deletedItem: result[0],
    });
  },
);

export default departmentsRouter;
