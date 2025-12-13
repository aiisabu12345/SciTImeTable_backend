import { Hono } from "hono";
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema.js";
import { HTTPException } from "hono/http-exception";
import * as V from "valibot";
import { describeRoute, resolver, validator } from "hono-openapi";
import { eq, and, ne, or, sql, desc, asc } from "drizzle-orm";

const connectionString: any = process.env.DATABASE_URL;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema, logger: true });

const departmentsRouter = new Hono();

const departmentSchema = V.object({
  id: V.number(),
  name_th: V.string(),
  name_en: V.string(),
  created_at: V.string(),
  updated_at: V.string(),
  code: V.string()
});

const querySchema = V.object({
  limit: V.optional(V.string(), "10"),
  page: V.optional(V.string(), "1"),
});

const searchQuerySchema = V.object({
  q: V.optional(V.string(),""),
  limit: V.optional(V.string(), "10"),
  page: V.optional(V.string(), "1"),
});

const inputDepartmentSchema = V.pick(departmentSchema, ["name_th", "name_en", "code"]);

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
          "application/json": { schema: resolver(V.array(departmentSchema)) },
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
  }
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
          "application/json": { schema: resolver(V.array(departmentSchema)) },
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
          
        `
      )
      .orderBy(sql`
        GREATEST(
          similarity(${schema.departmentsTable.name_th}, ${q}::text),
          similarity(${schema.departmentsTable.name_en}, ${q}::text)
        ) DESC
      `)
      .limit(limit)
      .offset(offset);

    return c.json(data);
  }
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
            schema: resolver(V.object({ message: V.string() })),
          },
        },
      },
      400: {
        description: "Duplicate department",
        content: {
          "application/json": {
            schema: resolver(V.object({ message: V.string() })),
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
          eq(schema.departmentsTable.code, data.code)
        )
      );

    if (exists)
      throw new HTTPException(400, { message: "department already exists" });
    await db.insert(schema.departmentsTable).values({
      name_th: data.name_th,
      name_en: data.name_en,
      code: data.code
    });
    return c.json({ message: "added successfully" });
  }
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
            schema: resolver(V.object({ message: V.string() })),
          },
        },
      },
      404: {
        description: "not found department",
        content: {
          "application/json": {
            schema: resolver(V.object({ message: V.string() })),
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
  }
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
            schema: resolver(V.object({ message: V.string() })),
          },
        },
      },
      404: {
        description: "not found department",
        content: {
          "application/json": {
            schema: resolver(V.object({ message: V.string() })),
          },
        },
      },
    },
  }),
  async (c) => {
    const id = Number(c.req.param("id"));
    const [exists] = await db
      .select()
      .from(schema.departmentsTable)
      .where(eq(schema.departmentsTable.id, id))
      .limit(1);

    if (!exists)
      throw new HTTPException(404, { message: "department not found" });

    await db
      .delete(schema.departmentsTable)
      .where(eq(schema.departmentsTable.id, id));

    return c.json({ message: "Deleted successfully" });
  }
);

export default departmentsRouter;
