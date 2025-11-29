import { Hono } from "hono";
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

const roomsRouter = new Hono();

const roomSchema = V.object({
  id: V.number(),
  created_at: V.string(),
  updated_at: V.string(),
  name: V.string(),
  type: V.string(),
  capacity: V.pipe(
    V.number(),
    V.minValue(0, "capacity must be a positive value.")
  ),
  building_id: V.number(),
});

const inputRoomSchema = V.pick(roomSchema, [
  "name",
  "type",
  "capacity",
  "building_id",
]);

const inputRoomValidator = validator("json", inputRoomSchema);

roomsRouter.get(
  "/",
  describeRoute({
    tags: ['rooms'],
    description: "Fetch all rooms",
    responses: {
      200: {
        description: "List of rooms",
        content: {
          "application/json": { schema: resolver(V.array(roomSchema)) },
        },
      },
    },
  }),
  async (c) => {
    const limit = Number(c.req.query("limit") ?? 10);
    const page = Number(c.req.query("page") ?? 1);

    const offset = (page - 1) * limit;

    const data = await db
      .select()
      .from(schema.roomsTable)
      .limit(limit)
      .offset(offset);

    return c.json(data);
  }
);

roomsRouter.post(
  "/",
  describeRoute({
    tags: ['rooms'],
    description: "add room",
    responses: {
      200: {
        description: "added room",
        content: {
          "application/json": {
            schema: resolver(V.object({ message: V.string() })),
          },
        },
      },
      400: {
        description: "Duplicate room",
        content: {
          "application/json": {
            schema: resolver(V.object({ message: V.string() })),
          },
        },
      },
    },
  }),
  inputRoomValidator,
  async (c) => {
    const data = await c.req.valid("json")
    const [exists] = await db
      .select()
      .from(schema.roomsTable)
      .where(eq(schema.roomsTable.name, data.name));
    if (exists)
      throw new HTTPException(400, { message: "room already exists" });
    await db.insert(schema.roomsTable).values({
      name: data.name,
      type: data.type,
      capacity: data.capacity,
      building_id: data.building_id,
    });
    return c.json({ message: "added successfully" });
  }
);

roomsRouter.put(
  "/:id",
  describeRoute({
    tags: ['rooms'],
    description: "edit room",
    responses: {
      200: {
        description: "edited room",
        content: {
          "application/json": {
            schema: resolver(V.object({ message: V.string() })),
          },
        },
      },
      400: {
        description: "bad request",
        content: {
          "application/json": {
            schema: resolver(V.object({ message: V.string() })),
          },
        },
      },
      404: {
        description: "not found room",
        content: {
          "application/json": {
            schema: resolver(V.object({ message: V.string() })),
          },
        },
      },
    },
  }),
  inputRoomValidator,
  async (c) => {
    const id = Number(c.req.param("id"));
    const data = await c.req.valid("json")
    const { name, type, capacity, building_id } = data;

    if (capacity < 0)
      throw new HTTPException(400, {
        message: "capacity must be a positive value",
      });

    const [exists] = await db
      .select()
      .from(schema.roomsTable)
      .where(eq(schema.roomsTable.id, id))
      .limit(1);
    if (!exists) throw new HTTPException(404, { message: "room not found" });

    const [nameExists] = await db
      .select()
      .from(schema.roomsTable)
      .where(
        and(eq(schema.roomsTable.name, name), ne(schema.roomsTable.id, id))
      )
      .limit(1);
    if (nameExists)
      throw new HTTPException(400, { message: "name already exists" });

    const updated = await db
      .update(schema.roomsTable)
      .set({
        name,
        type,
        capacity,
        building_id,
      })
      .where(eq(schema.roomsTable.id, id))
      .returning();

    return c.json({ message: "room updated", room: updated });
  }
);

roomsRouter.delete(
  "/:id",
  describeRoute({
    tags: ['rooms'],
    description: "delete room",
    responses: {
      200: {
        description: "room deleted",
        content: {
          "application/json": {
            schema: resolver(V.object({ message: V.string() })),
          },
        },
      },
      404: {
        description: "not found room",
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
      .from(schema.roomsTable)
      .where(eq(schema.roomsTable.id, id))
      .limit(1);

    if (!exists) throw new HTTPException(404, { message: "room not found" });

    await db.delete(schema.roomsTable).where(eq(schema.roomsTable.id, id));

    return c.json({ message: "Deleted successfully" });
  }
);

export default roomsRouter;
