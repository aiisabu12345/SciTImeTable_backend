ALTER TABLE "buildings" RENAME COLUMN "code" TO "name_en";--> statement-breakpoint
ALTER TABLE "buildings" RENAME COLUMN "name" TO "name_th";--> statement-breakpoint
ALTER TABLE "buildings" DROP CONSTRAINT "buildings_code_unique";--> statement-breakpoint
ALTER TABLE "buildings" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "buildings" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "buildings" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "departments" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "programs" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "building_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "room_types" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "departments" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_name_en_unique" UNIQUE("name_en");