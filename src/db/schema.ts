import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const departmentsTable = pgTable("departments",({
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().$onUpdate(() => new Date()),
  name_th: text("name_th").notNull(),
  name_en: text("name_en").notNull(),
}));

export const programsTable = pgTable("programs",({
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().$onUpdate(() => new Date()),
  name_th: text("name_th").notNull(),
  name_en: text("name_en").notNull(),
  num_years: integer("num_years").notNull(),
  department_id: integer("department_id").notNull().references(() => departmentsTable.id)
}));

export const buildingsTable = pgTable("buildings",({
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().$onUpdate(() => new Date()),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
}));

export const roomsTable = pgTable("rooms",({
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().$onUpdate(() => new Date()),
    name : text("name").notNull(),
    type : text("type").notNull(),
    capacity : integer("capacity").notNull(),
    building_id: integer("building_id").notNull().references(() => buildingsTable.id)
}));

export const roomtypesTable = pgTable("room_types",({
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().$onUpdate(() => new Date()),
    name: text("name").notNull()
}))