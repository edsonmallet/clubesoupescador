CREATE SCHEMA "tournaments";
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "tournaments"."tournament_status" AS ENUM('open', 'closed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tournaments"."submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tournament_id" uuid NOT NULL,
	"author_uid" text NOT NULL,
	"media_url" text NOT NULL,
	"vote_score" integer DEFAULT 0 NOT NULL,
	"manual_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tournaments"."tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "tournaments"."tournament_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tournaments"."submissions" ADD CONSTRAINT "submissions_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"."tournaments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
