import { type Context, Hono } from "hono";
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema.js";
import { HTTPException } from "hono/http-exception";
import * as V from "valibot";
import { describeRoute, resolver, validator } from "hono-openapi";
import { eq, and, ne } from "drizzle-orm";

const connectionString: any = process.env.DATABASE_URL;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema, logger: true });

const departmentsRouter = new Hono();

const departmentSchema = V.object({
  id: V.number(),
  code: V.string(),
  name_th: V.string(),
  name_en: V.string(),
  created_at: V.string(),
  updated_at: V.string(),
});

const inputdepartmentSchema = V.pick(departmentSchema, [
  "name_th",
  "name_en",
  "code",
]);

const inputDepartmentValidator = validator("json", inputdepartmentSchema);

departmentsRouter.get(
  "/",
  describeRoute({
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
  async (c: Context) => {
    const limit = Number(c.req.query("limit") ?? 10);
    const page = Number(c.req.query("page") ?? 1);

    const offset = (page - 1) * limit;

    const data = await db
      .select()
      .from(schema.departmentsTable)
      .limit(limit)
      .offset(offset);

    return c.json(data);
  }
);

departmentsRouter.post(
  "/",
  describeRoute({
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
  async (c: Context) => {
    const data = (await (c.req as any).valid("json")) as V.InferOutput<
      typeof inputdepartmentSchema
    >;
    const [exists] = await db
      .select()
      .from(schema.departmentsTable)
      .where(eq(schema.departmentsTable.code, data.code));
    if (exists)
      throw new HTTPException(400, { message: "department already exists" });
    await db.insert(schema.departmentsTable).values({
      name_th: data.name_th,
      name_en: data.name_en,
      code: data.code,
      updated_at: new Date(),
    });
    return c.json({ message: "added successfully" });
  }
);

departmentsRouter.put(
  "/:id",
  describeRoute({
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
      400: {
        description: "duplicate department code",
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
  async (c: Context) => {
    const id = Number(c.req.param("id"));
    const data = (await (c.req as any).valid("json")) as V.InferOutput<
      typeof inputdepartmentSchema
    >;
    const { code, name_th, name_en } = data;

    const [exists] = await db
      .select()
      .from(schema.departmentsTable)
      .where(eq(schema.departmentsTable.id, id))
      .limit(1);
    if (!exists)
      throw new HTTPException(404, { message: "department not found" });

    const [codeExists] = await db
      .select()
      .from(schema.departmentsTable)
      .where(
        and(
          eq(schema.departmentsTable.code, code),
          ne(schema.departmentsTable.id, id)
        )
      )
      .limit(1);
    if (codeExists)
      throw new HTTPException(400, { message: "code already exists" });

    const updated = await db
      .update(schema.departmentsTable)
      .set({
        code,
        name_th,
        name_en,
        updated_at: new Date(),
      })
      .where(eq(schema.departmentsTable.id, id))
      .returning();

    return c.json({ message: "Department updated", department: updated });
  }
);

departmentsRouter.delete(
  "/:id",
  describeRoute({
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
  async (c: Context) => {
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
