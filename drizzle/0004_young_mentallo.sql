ALTER TABLE "schedules" ALTER COLUMN "mid_day" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "schedules" ALTER COLUMN "final_day" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "pair_group" integer NOT NULL;