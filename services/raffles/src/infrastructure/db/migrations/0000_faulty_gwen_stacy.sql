CREATE SCHEMA "raffles";
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "raffles"."raffle_status" AS ENUM('open', 'closed', 'drawn');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "raffles"."ticket_source" AS ENUM('subscription_conversion', 'purchase');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "raffles"."ticket_status" AS ENUM('pending', 'confirmed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "raffles"."raffles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"prize" text NOT NULL,
	"image_url" text,
	"ticket_price_cents" integer NOT NULL,
	"status" "raffles"."raffle_status" DEFAULT 'open' NOT NULL,
	"contest_number" integer,
	"winner_ticket" integer,
	"winner_uid" text,
	"drawn_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "raffles"."tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"raffle_id" uuid NOT NULL,
	"uid" text NOT NULL,
	"number" integer NOT NULL,
	"status" "raffles"."ticket_status" DEFAULT 'pending' NOT NULL,
	"source" "raffles"."ticket_source" NOT NULL,
	"asaas_payment_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "raffles"."tickets" ADD CONSTRAINT "tickets_raffle_id_raffles_id_fk" FOREIGN KEY ("raffle_id") REFERENCES "raffles"."raffles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tickets_raffle_number_idx" ON "raffles"."tickets" USING btree ("raffle_id","number");