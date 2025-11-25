import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const departmentsTable = pgTable("departments", (t) => ({
  id: t.integer("id").primaryKey().generatedAlwaysAsIdentity(),
  created_at: t.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: t.timestamp("updated_at", { withTimezone: true }).notNull(),
  name_th: t.text("name_th").notNull(),
  name_en: t.text("name_en").notNull(),
  code: t.text("code").notNull()
}));

export const programsTable = pgTable("programs", (t) => ({
  id: t.integer("id").primaryKey().generatedAlwaysAsIdentity(),
  created_at: t.timestamp("created_at").notNull().defaultNow(),
  updated_at: t.timestamp("updated_at").notNull(),
  name_th: t.text("name_th").notNull(),
  name_en: t.text("name_en").notNull(),
  code: t.text("code").notNull(),
  num_years: t.integer("num_years").notNull(),
  department_id: t.integer("department_id").notNull().references(() => departmentsTable.id)
}));

export const buildingTable = pgTable("building", (t) => ({
  id: t.integer("id").primaryKey().generatedAlwaysAsIdentity(),
  created_at: t.timestamp("created_at").notNull().defaultNow(),
  updated_at: t.timestamp("updated_at").notNull(),
  code: t.text("code").notNull().unique(),
  name: t.text("name").notNull(),
}));

export const roomsTable = pgTable("rooms", (t) => ({
    id: t.integer("id").primaryKey().generatedAlwaysAsIdentity(),
    created_at: t.timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull(),
    name : t.text("name").notNull(),
    type : t.text("type").notNull(),
    capacity : t.integer("capacity").notNull(),
    building_id: t.integer("building_id").notNull().references(() => buildingTable.id)
}));