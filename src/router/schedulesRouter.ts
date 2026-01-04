import { Hono } from "hono";
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema.js";
import { HTTPException } from "hono/http-exception";
import * as z from "zod";
import { describeRoute, resolver, validator } from "hono-openapi";
import { eq, and, ne, or, sql, desc, asc, lt, gt } from "drizzle-orm";
import iconv from "iconv-lite";
import fs from "fs";
import csv from "neat-csv";
import * as XLSX from "xlsx";
import { en } from "zod/v4/locales";
import xlsx_to_csv_arraybuffer from "../service/xlsx_to_csv_arraybuffer.service.js";
import scheduleProcessing from "../service/scheduleProcessing.service.js";

const connectionString: any = process.env.DATABASE_URL;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema, logger: true });

const schedulesRouter = new Hono();

const fileSchema = z.object({
  file: z.any() || z.array(z.any()),
});

const schedulesSchema = z.object({
  id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  course_id: z.string(),
  status: z.string(),
  program_id: z.number(),
  type: z.string(),
  group: z.number(),
  pair_group: z.number(),
  student_count: z.number(),
  lecturer: z.string(),
  day: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  room_id: z.string(),
  mid_day: z.string(),
  mid_start_time: z.string(),
  mid_end_time: z.string(),
  final_day: z.string(),
  final_start_time: z.string(),
  final_end_time: z.string(),
});

const schedulesSchemaForReadTable = z.object({
  course_id: z.string(),
  program_id: z.number(),
  type: z.string(),
  group: z.number(),
  pair_group: z.number(),
  student_count: z.number(),
  lecturer: z.string(),
  day: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  room_id: z.string(),
  mid_day: z.string(),
  mid_start_time: z.string(),
  mid_end_time: z.string(),
  final_day: z.string(),
  final_start_time: z.string(),
  final_end_time: z.string(),
  problem: z.array(z.string()),
});

const inputSchedulesSchema1 = z.object({
  data: z.array(
    schedulesSchema.pick({
      course_id: true,
      program_id: true,
      type: true,
      group: true,
      pair_group: true,
      student_count: true,
      lecturer: true,
      day: true,
      start_time: true,
      end_time: true,
      room_id: true,
      mid_day: true,
      mid_start_time: true,
      mid_end_time: true,
      final_day: true,
      final_start_time: true,
      final_end_time: true,
    })
  ),
});

const inputSchedulesSchema2 = z.object({
  data: schedulesSchema.pick({
    course_id: true,
    program_id: true,
    type: true,
    group: true,
    pair_group: true,
    student_count: true,
    lecturer: true,
    day: true,
    start_time: true,
    end_time: true,
    room_id: true,
    mid_day: true,
    mid_start_time: true,
    mid_end_time: true,
    final_day: true,
    final_start_time: true,
    final_end_time: true,
  }),
});

//for post
const inputSchedulesValidator1 = validator("json", inputSchedulesSchema1);

//for put
const inputSchedulesValidator2 = validator("json", inputSchedulesSchema2);

//for readfile
const inputFileSchema = validator("form", fileSchema);

schedulesRouter.get(
  "/:id",
  describeRoute({
    tags: ["schedules"],
    description: "Fetch schedule with id",
    responses: {
      200: {
        description: "schedule",
        content: {
          "application/json": { schema: resolver(schedulesSchema) },
        },
      },
      404: {
        description: "schedule not found",
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

    const data = await db
      .select()
      .from(schema.schedulesTable)
      .where(eq(schema.schedulesTable.id, id))
      .limit(1);

    if (!data) {
      throw new HTTPException(404, { message: "schedule not found" });
    }

    return c.json(data);
  }
);

schedulesRouter.get(
  "/",
  describeRoute({
    tags: ["schedules"],
    description: "Fetch all schedules",
    responses: {
      200: {
        description: "List of schedules",
        content: {
          "application/json": { schema: resolver(z.array(schedulesSchema)) },
        },
      },
    },
  }),
  async (c) => {
    const data = await db
      .select()
      .from(schema.schedulesTable)
      .orderBy(desc(schema.schedulesTable.created_at));

    return c.json(data);
  }
);

schedulesRouter.post(
  "/",
  describeRoute({
    tags: ["schedules"],
    description: "add schedules",
    responses: {
      200: {
        description: "added schedules",
        content: {
          "application/json": {
            schema: resolver(z.object({ message: z.string() })),
          },
        },
      },
      409: {
        description: "schedule conflict",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                message: z.string(),
                cause: z.object({
                  conflict: z.boolean(),
                  details: z.array(
                    z.object({
                      data: inputSchedulesSchema1,
                      conflictWith: z.number(),
                    })
                  ),
                }),
              })
            ),
          },
        },
      },
    },
  }),
  inputSchedulesValidator1,
  async (c) => {
    const payload = await c.req.valid("json");
    const conflict = [];
    for (const item of payload.data) {
      const [timeConflict] = await db
        .select({
          id: schema.schedulesTable.id,
        })
        .from(schema.schedulesTable)
        .where(
          and(
            eq(schema.schedulesTable.day, item.day),
            eq(schema.schedulesTable.room_id, item.room_id),
            and(
              lt(schema.schedulesTable.start_time, item.end_time),
              gt(schema.schedulesTable.end_time, item.start_time)
            )
          )
        )
        .limit(1);

      if (timeConflict) {
        const dataConflict = {
          data: item,
          conflictWith: timeConflict.id,
        };

        conflict.push(dataConflict);
      }
    }

    if (conflict.length > 0) {
      throw new HTTPException(409, {
        message: "have conflict",
        cause: { conflict: true, details: conflict },
      });
    }

    await db.insert(schema.schedulesTable).values(
      payload.data.map((item) => ({
        course_id: item.course_id,
        program_id: item.program_id,
        type: item.type,
        group: item.group,
        pair_group: item.pair_group,
        student_count: item.student_count,
        lecturer: item.lecturer,
        day: item.day,
        start_time: item.start_time,
        end_time: item.end_time,
        room_id: item.room_id,
        mid_day: item.mid_day,
        mid_start_time: item.mid_start_time,
        mid_end_time: item.mid_end_time,
        final_day: item.final_day,
        final_start_time: item.final_start_time,
        final_end_time: item.final_end_time,
      }))
    );

    return c.json({ message: "added successfully" });
  }
);

schedulesRouter.post(
  "/readTable",
  describeRoute({
    tags: ["schedules"],
    description: "read csv file",
    responses: {
      200: {
        description: "read csv succeed",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                data: z.array(schedulesSchemaForReadTable),
              })
            ),
          },
        },
      },
      400: {
        description: "wrong file format",
        content: {
          "application/json": {
            schema: resolver(z.object({ message: z.string() })),
          },
        },
      },
    },
  }),
  inputFileSchema,
  async (c) => {
    const form = await c.req.formData();
    const filesRaw = form.getAll("file") as File[];

    const file = Array.isArray(filesRaw) ? filesRaw : [filesRaw];

    if (!(file instanceof File || Array.isArray(file))) {
      throw new HTTPException(400, { message: "File is required " });
    }

    //xlsx to csv arraybuffer
    const csvFiles = await xlsx_to_csv_arraybuffer(file);

    const programData = await db
      .select({
        id: schema.programsTable.id,
        name_th: schema.programsTable.name_th,
      })
      .from(schema.programsTable);

    console.log(programData);

    const scheduleData = await db
      .select({
        id: schema.schedulesTable.id,
        room_id: schema.schedulesTable.room_id,
        day: schema.schedulesTable.day,
        start_time: schema.schedulesTable.start_time,
        end_time: schema.schedulesTable.end_time,
      })
      .from(schema.schedulesTable);

    interface dataType {
      course_id: string;
      program_id: number;
      type: string;
      group: number;
      pair_group: number;
      student_count: number;
      lecturer: string;
      day: string;
      start_time: string;
      end_time: string;
      room_id: string;
      mid_day: string;
      mid_start_time: string;
      mid_end_time: string;
      final_day: string;
      final_start_time: string;
      final_end_time: string;
      problem: string[];
    }

    //process csvbuffer to data
    const data: dataType[] = await scheduleProcessing(
      programData,
      scheduleData,
      csvFiles
    );

    return c.json({ success: true, data: data });
  }
);

schedulesRouter.put(
  "/:id",
  describeRoute({
    tags: ["schedules"],
    description: "edit schedule",
    responses: {
      200: {
        description: "schedule edited",
        content: {
          "application/json": {
            schema: resolver(z.object({ message: z.string() })),
          },
        },
      },
      404: {
        description: "not found schedule",
        content: {
          "application/json": {
            schema: resolver(z.object({ message: z.string() })),
          },
        },
      },
      409: {
        description: "time conflict",
        content: {
          "application/json": {
            schema: resolver(z.object({ message: z.string() })),
          },
        },
      },
    },
  }),
  inputSchedulesValidator2,
  async (c) => {
    const id = Number(c.req.param("id"));
    const payload = await c.req.valid("json");
    const {
      course_id,
      program_id,
      type,
      group,
      pair_group,
      student_count,
      lecturer,
      day,
      start_time,
      end_time,
      room_id,
      mid_day,
      mid_start_time,
      mid_end_time,
      final_day,
      final_start_time,
      final_end_time,
    } = payload.data;

    const [exists] = await db
      .select()
      .from(schema.schedulesTable)
      .where(eq(schema.schedulesTable.id, id))
      .limit(1);
    if (!exists)
      throw new HTTPException(404, { message: "schedule not found" });

    const [duplicateTime] = await db
      .select()
      .from(schema.schedulesTable)
      .where(
        and(
          eq(schema.schedulesTable.day, day),
          eq(schema.schedulesTable.room_id, room_id),
          and(
            lt(schema.schedulesTable.start_time, end_time),
            gt(schema.schedulesTable.end_time, start_time)
          )
        )
      )
      .limit(1);

    if (duplicateTime) {
      throw new HTTPException(409, {
        message: `duplicate time with id:${duplicateTime.id}`,
      });
    }

    const [duplicateGroup] = await db
      .select()
      .from(schema.schedulesTable)
      .where(
        and(
          and(
            eq(schema.schedulesTable.course_id, course_id),
            or(
              eq(schema.schedulesTable.group, group),
              eq(schema.schedulesTable.group, pair_group),
              eq(schema.schedulesTable.pair_group, pair_group),
              eq(schema.schedulesTable.pair_group, group)
            )
          )
        )
      )
      .limit(1);

    if (duplicateGroup) {
      throw new HTTPException(409, {
        message: `duplicate group with id:${duplicateGroup.id}`,
      });
    }

    const updated = await db
      .update(schema.schedulesTable)
      .set({
        course_id,
        program_id,
        type,
        group,
        pair_group,
        student_count,
        lecturer,
        day,
        start_time,
        end_time,
        room_id,
        mid_day,
        mid_start_time,
        mid_end_time,
        final_day,
        final_start_time,
        final_end_time,
      })
      .where(eq(schema.schedulesTable.id, id))
      .returning();
    return c.json({ message: "schedule updated", schedule: updated });
  }
);

schedulesRouter.delete(
  "/:id",
  describeRoute({
    tags: ["schedules"],
    description: "delete schedule",
    responses: {
      200: {
        description: "schedule deleted",
        content: {
          "application/json": {
            schema: resolver(z.object({ message: z.string() })),
          },
        },
      },
      404: {
        description: "not found schedule",
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
    const [exists] = await db
      .select()
      .from(schema.schedulesTable)
      .where(eq(schema.schedulesTable.id, id))
      .limit(1);

    if (!exists)
      throw new HTTPException(404, { message: "schedule not found" });

    await db
      .delete(schema.schedulesTable)
      .where(eq(schema.schedulesTable.id, id));
    return c.json({ message: "Deleted successfully" });
  }
);

export default schedulesRouter;
