import {
  pgTable,
  text,
  integer,
  timestamp,
  time,
  date,
} from "drizzle-orm/pg-core";
import { string } from "valibot";

export const departmentsTable = pgTable("departments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  code: text("code").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .$onUpdate(() => new Date()),
  name_th: text("name_th").notNull(),
  name_en: text("name_en").notNull(),
});

export const programsTable = pgTable("programs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
  name_th: text("name_th").notNull(),
  name_en: text("name_en").notNull(),
  num_years: integer("num_years").notNull(),
  department_id: integer("department_id")
    .notNull()
    .references(() => departmentsTable.id),
});

export const buildingsTable = pgTable("buildings", {
  id: text("id").primaryKey().notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
  name_en: text("name_en").notNull().unique(),
  name_th: text("name_th").notNull(),
});

export const roomsTable = pgTable("rooms", {
  id: text("id").primaryKey().notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
  name: text("name").notNull(),
  type: text("type").notNull(),
  capacity: integer("capacity").notNull(),
  building_id: text("building_id")
    .notNull()
    .references(() => buildingsTable.id),
});

export const roomtypesTable = pgTable("room_types", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
  name: text("name").notNull(),
});

export const coursesTable = pgTable("courses", {
  id: text("id").primaryKey().notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
  name_th: text("name_th").notNull(),
  name_en: text("name_en").notNull(),
  credit: integer("credit").notNull(),
  credit_l: integer("credit_l").notNull(),
  credit_p: integer("credit_p").notNull(),
  credit_s: integer("credit_s").notNull(),
  academic_year: integer("academic_year").notNull(),
  semester: integer("semester").notNull(),
});

export const schedulesTable = pgTable("schedules", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
  course_id: text("course_id")
    .notNull()
    .references(() => coursesTable.id),
  status: text("status")
    .notNull()
    .$onUpdate(() => "รอดำเนินการ"),
  program_id: integer("program_id")
    .notNull()
    .references(() => programsTable.id),
  type: text("type").notNull(),
  group: integer("group").notNull(),
  pair_group: integer("pair_group").notNull(),
  student_count: integer("student_count").notNull(),
  lecturer: text("lecturer").notNull(),
  day: text("day").notNull(),
  start_time: time("start_time").notNull(),
  end_time: time("end_time").notNull(),
  room_id: text("room_id")
    .notNull()
    .references(() => roomsTable.id),
  mid_day: date("mid_day"),
  mid_start_time: time("mid_start_time"),
  mid_end_time: time("mid_end_time"),
  final_day: date("final_day"),
  final_start_time: time("final_start_time"),
  final_end_time: time("final_end_time"),
});
