import { Hono } from "hono";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { describeRoute, resolver, validator } from "hono-openapi";
// import { createInsertSchema, createSelectSchema } from "drizzle-zod";
// import { selectCourseSchema, insertCourseSchema, updateCourseSchema } from "../db/schema.js";
// import { off } from "process";
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

// const courseSelectSchema = createSelectSchema(schema.coursesTable);
// const courseInsertSchema = createInsertSchema(schema.coursesTable);

const courseSchema = z.object({
  id: z.string(),
  name_en:z.string(),
  name_th:z.string(),
  credit:z.number(),
  credit_l:z.number(),
  credit_p:z.number(),
  credit_s:z.number(),
  status:z.string(),
  academic_year:z.number(),
  semester:z.number(),
  updated_time: z.string(),
  created_time: z.string()
})

const coursesRouter = new Hono();

coursesRouter.get(
  '/',
  describeRoute({
    tags: ['Courses'],
    description: "Get all courses in the system",
    responses: {
      200: {
        description: "List of all courses",
        // content: { "application/json": { schema: resolver(z.array(selectCourseSchema)) } },
        content: { "application/json": { schema: resolver(z.array(courseSchema)) } },
      },
    },
  }),
  async (c) => {
    const limitParam = c.req.query("limit");
    const pageParam = c.req.query("page");

    // No limit
    if (!limitParam || Number(limitParam) === 0) {
      console.log("nolimit")
      const data = await db.select().from(schema.coursesTable);
      return c.json(data);
    }

    const limit = Number(limitParam);
    const page = Number(pageParam) || 1;

    // Make sure page is not negative
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * limit;

    console.log(`Fetching courses: Page ${safePage}, Limit ${limit}, Offset ${offset}`);

    const data = await db
      .select()
      .from(schema.coursesTable)
      .limit(limit)
      .offset(offset);

    return c.json(data);
  }
);

coursesRouter.get(
  '/current-term',
  describeRoute({
    tags: ['Courses'],
    description: "Fetch all currently active courses",
    responses: {
      200: {
        description: "List of active courses",
        content: {
          // "application/json": { schema: resolver(z.array(selectCourseSchema)) },
          "application/json": { schema: resolver(z.array(courseSchema)) },
        },
      },
    },
  }),
  async (c) => {
    const data = await db
      .select()
      .from(schema.coursesTable)
      .where(
        eq(schema.coursesTable.status, "active")
      );
    return c.json(data);
  }
);

coursesRouter.post(
  '/',
  validator('json', courseSchema.omit({updated_time:true,created_time:true})),
  describeRoute({
    tags: ['Courses'],
    description: "Create new course",
    responses: {
      201: {
        description: "Course created",
        content: {
          // "application/json": { schema: resolver(courseSelectSchema) },
          "application/json": { schema: resolver(courseSchema) },
        },
      },
    },
  }),
  async (c) => {
    const validatedBody = c.req.valid('json');

    // Check if data already exists
    const existing = await db
      .select()
      .from(schema.coursesTable)
      .where(eq(schema.coursesTable.id, validatedBody.id))
      .limit(1);
    if (existing.length > 0) {
      return c.json({ error: "Course ID already exists" }, 409);
    }

    // Save to db
    const result = await db
      .insert(schema.coursesTable)
      .values(validatedBody)
      .returning();

    return c.json(result[0], 201);
  }
);

coursesRouter.put(
  '/:id',
  validator('json', courseSchema.omit({
    updated_time:true,
    created_time:true
  })),
  describeRoute({
    tags: ['Courses'],
    description: "Update course details by ID",
    responses: {
      200: {
        description: "Course updated",
        // content: { "application/json": { schema: resolver(selectCourseSchema) } },
        content: { "application/json": { schema: resolver(courseSchema) } },
      },
    },
  }),
  async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');

    // If trying to change id
    if (body.id && body.id !== id) {
      const existing = await db
        .select()
        .from(schema.coursesTable)
        .where(eq(schema.coursesTable.id, body.id))
        .limit(1);

      if (existing.length > 0) {
        return c.json({ error: "New Course ID is already taken" }, 409);
      }
    }

    const result = await db
      .update(schema.coursesTable)
      .set({
        ...body,
        // updated_at: new Date()
      })
      .where(eq(schema.coursesTable.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: "Course not found" }, 404);
    }
    return c.json(result[0]);
  }
);

coursesRouter.delete(
  '/:id',
  describeRoute({
    tags: ['Courses'],
    description: "Delete a course by ID",
    responses: {
      200: { description: "Course deleted successfully" },
      404: { description: "Course not found" }
    },
  }),
  async (c) => {
    const id = c.req.param('id');

    const result = await db
      .delete(schema.coursesTable)
      .where(eq(schema.coursesTable.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: "Course not found" }, 404);
    }

    return c.json({
      message: "Course deleted successfully",
      deletedItem: result[0]
    });
  }
);

export default coursesRouter;