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

const programsRouter = new Hono();

const programSchema = V.object({
  id: V.number(),
  code: V.string(),
  name_th: V.string(),
  name_en: V.string(),
  created_at: V.string(),
  updated_at: V.string(),
  num_years: V.number(),
  department_id: V.number()
});

const inputprogramSchema = V.pick(programSchema, [
  "name_th",
  "name_en",
  "code",
  "num_years",
  "department_id"
]);

const inputProgramValidator = validator("json", inputprogramSchema);

programsRouter.get(
  "/",
  describeRoute({
    description: "Fetch all programs",
    responses: {
      200: {
        description: "List of programs",
        content: {
          "application/json": { schema: resolver(V.array(programSchema)) },
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
      .from(schema.programsTable)
      .limit(limit)
      .offset(offset);

    return c.json(data);
  }
);

programsRouter.post(
  "/",
  describeRoute({
    description: "add program",
    responses: {
      200: {
        description: "added program",
        content: {
          "application/json": {
            schema: resolver(V.object({ message: V.string() })),
          },
        },
      },
      400: {
        description: "Duplicate program",
        content: {
          "application/json": {
            schema: resolver(V.object({ message: V.string() })),
          },
        },
      },
    },
  }),
  inputProgramValidator,
  async (c: Context) => {
    const data = (await (c.req as any).valid("json")) as V.InferOutput<
      typeof inputprogramSchema
    >;
    const [exists] = await db
      .select()
      .from(schema.programsTable)
      .where(eq(schema.programsTable.code, data.code));
    if (exists)
      throw new HTTPException(400, { message: "program already exists" });
    await db.insert(schema.programsTable).values({
      name_th: data.name_th,
      name_en: data.name_en,
      code: data.code,
      num_years: data.num_years,
      department_id: data.department_id,
      updated_at: new Date(),
    });
    return c.json({ message: "added successfully" });
  }
);

programsRouter.put(
  "/:id",
  describeRoute({
    description: "edit program",
    responses: {
      200: {
        description: "edited program",
        content: {
          "application/json": {
            schema: resolver(V.object({ message: V.string() })),
          },
        },
      },
      400: {
        description: "duplicate program code",
        content: {
          "application/json": {
            schema: resolver(V.object({ message: V.string() })),
          },
        },
      },
      404: {
        description: "not found program",
        content: {
          "application/json": {
            schema: resolver(V.object({ message: V.string() })),
          },
        },
      },
    },
  }),
  inputProgramValidator,
  async (c: Context) => {
    const id = Number(c.req.param("id"));
    const data = (await (c.req as any).valid("json")) as V.InferOutput<
      typeof inputprogramSchema
    >;
    const { code, name_th, name_en, num_years, department_id } = data;

    const [exists] = await db
      .select()
      .from(schema.programsTable)
      .where(eq(schema.programsTable.id, id))
      .limit(1);
    if (!exists)
      throw new HTTPException(404, { message: "program not found" });

    const [codeExists] = await db
      .select()
      .from(schema.programsTable)
      .where(
        and(
          eq(schema.programsTable.code, code),
          ne(schema.programsTable.id, id)
        )
      )
      .limit(1);
    if (codeExists)
      throw new HTTPException(400, { message: "code already exists" });

    const updated = await db
      .update(schema.programsTable)
      .set({
        code,
        name_th,
        name_en,
        num_years,
        department_id,
        updated_at: new Date(),
      })
      .where(eq(schema.programsTable.id, id))
      .returning();

    return c.json({ message: "Program updated", program: updated });
  }
);

programsRouter.delete(
  "/:id",
  describeRoute({
    description: "delete program",
    responses: {
      200: {
        description: "program deleted",
        content: {
          "application/json": {
            schema: resolver(V.object({ message: V.string() })),
          },
        },
      },
      404: {
        description: "not found program",
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
      .from(schema.programsTable)
      .where(eq(schema.programsTable.id, id))
      .limit(1);

    if (!exists)
      throw new HTTPException(404, { message: "program not found" });

    await db
      .delete(schema.programsTable)
      .where(eq(schema.programsTable.id, id));

    return c.json({ message: "Deleted successfully" });
  }
);

export default programsRouter;
