CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"name_th" text NOT NULL,
	"name_en" text NOT NULL,
	"credit" integer NOT NULL,
	"credit_l" integer NOT NULL,
	"credit_p" integer NOT NULL,
	"credit_s" integer NOT NULL,
	"academic_year" integer NOT NULL,
	"semester" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "schedules_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"course_id" text NOT NULL,
	"status" text NOT NULL,
	"program_id" integer NOT NULL,
	"type" text NOT NULL,
	"group" integer NOT NULL,
	"student_count" integer NOT NULL,
	"lecturer" text NOT NULL,
	"day" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"room_id" text NOT NULL,
	"mid_day" text NOT NULL,
	"mid_start_time" text NOT NULL,
	"mid_end_time" text NOT NULL,
	"final_day" text NOT NULL,
	"final_start_time" text NOT NULL,
	"final_end_time" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;