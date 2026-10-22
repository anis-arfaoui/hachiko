CREATE TABLE "apple_wallet_registrations" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"device_library_identifier" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"pass_type_identifier" text NOT NULL,
	"push_token" text NOT NULL,
	"serial_number" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cashiers" (
	"code" text NOT NULL,
	"code_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"last_active_at" timestamp,
	"location_id" text,
	"name" text NOT NULL,
	"organization_id" text NOT NULL,
	"token" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cashiers_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "managers" (
	"code" text NOT NULL,
	"code_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"last_active_at" timestamp,
	"name" text NOT NULL,
	"organization_id" text NOT NULL,
	"token" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "managers_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "cashier_id" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "code" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "redemptions" ADD COLUMN "cashier_id" text;--> statement-breakpoint
ALTER TABLE "rewards" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "cashier_id" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "location_id" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "spend_amount" integer;--> statement-breakpoint
ALTER TABLE "apple_wallet_registrations" ADD CONSTRAINT "apple_wallet_registrations_serial_number_cards_id_fk" FOREIGN KEY ("serial_number") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashiers" ADD CONSTRAINT "cashiers_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashiers" ADD CONSTRAINT "cashiers_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "managers" ADD CONSTRAINT "managers_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "apple_registrations_device_pass_serial_idx" ON "apple_wallet_registrations" USING btree ("device_library_identifier","pass_type_identifier","serial_number");--> statement-breakpoint
CREATE UNIQUE INDEX "cashiers_org_name_idx" ON "cashiers" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "cashiers_code_idx" ON "cashiers" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "managers_org_name_idx" ON "managers" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "managers_code_idx" ON "managers" USING btree ("code");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_cashier_id_cashiers_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."cashiers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_cashier_id_cashiers_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."cashiers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cashier_id_cashiers_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."cashiers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_org_code_idx" ON "customers" USING btree ("organization_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_organization_id_idx" ON "subscriptions" USING btree ("organization_id");