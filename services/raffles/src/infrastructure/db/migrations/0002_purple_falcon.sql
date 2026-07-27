ALTER TABLE "raffles"."raffles" ADD COLUMN "max_tickets" integer;--> statement-breakpoint
ALTER TABLE "raffles"."raffles" ADD COLUMN "draw_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "raffles"."raffles" ADD COLUMN "lottery_game" text DEFAULT 'federal' NOT NULL;