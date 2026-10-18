import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { organization, user } from "./auth";

export const locations = pgTable("locations", {
  address: text("address"),
  city: text("city"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  id: text("id").primaryKey(),
  isDefault: boolean("is_default").default(false).notNull(),
  name: text("name").notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  phone: text("phone"),
  // Status can be 'active' or 'pending'
  status: text("status").default("active").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const programs = pgTable("programs", {
  brandColor: text("brand_color").default("#18181b").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  id: text("id").primaryKey(),
  logoUrl: text("logo_url"),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  rewardLabel: text("reward_label").default("1 Récompense offerte").notNull(),
  stampsRequired: integer("stamps_required").default(10).notNull(),
  // Type can be 'stamps' or 'points'
  type: text("type").default("stamps").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rewards = pgTable("rewards", {
  cost: integer("cost").default(10).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  description: text("description"),
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  programId: text("program_id")
    .notNull()
    .references(() => programs.id, { onDelete: "cascade" }),
});

export const cashiers = pgTable(
  "cashiers",
  {
    code: text("code").notNull(),
    codeExpiresAt: timestamp("code_expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id").primaryKey(),
    lastActiveAt: timestamp("last_active_at"),
    locationId: text("location_id").references(() => locations.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("cashiers_org_name_idx").on(table.organizationId, table.name),
    uniqueIndex("cashiers_code_idx").on(table.code),
  ]
);

export const managers = pgTable(
  "managers",
  {
    code: text("code").notNull(),
    codeExpiresAt: timestamp("code_expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id").primaryKey(),
    lastActiveAt: timestamp("last_active_at"),
    name: text("name").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("managers_org_name_idx").on(table.organizationId, table.name),
    uniqueIndex("managers_code_idx").on(table.code),
  ]
);

export const customers = pgTable(
  "customers",
  {
    cashierId: text("cashier_id").references(() => cashiers.id, {
      onDelete: "set null",
    }),
    code: text("code"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    phone: text("phone").notNull(),
  },
  (table) => [
    uniqueIndex("customers_org_phone_idx").on(
      table.organizationId,
      table.phone
    ),
    uniqueIndex("customers_org_code_idx").on(table.organizationId, table.code),
  ]
);

export const cards = pgTable(
  "cards",
  {
    balance: integer("balance").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    // Random, secret cryptographic token used in QR code
    token: text("token").notNull().unique(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("cards_customer_program_idx").on(
      table.customerId,
      table.programId
    ),
  ]
);

export const transactions = pgTable(
  "transactions",
  {
    amount: integer("amount").default(1).notNull(),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    cashierId: text("cashier_id").references(() => cashiers.id, {
      onDelete: "set null",
    }),
    // Unique UUID generated by device, prevents duplicate/double stamps
    clientUuid: text("client_uuid").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id").primaryKey(),
    locationId: text("location_id").references(() => locations.id, {
      onDelete: "set null",
    }),
    spendAmount: integer("spend_amount"),
    staffUserId: text("staff_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    // Type can be 'stamp', 'points', or 'reset'
    type: text("type").default("stamp").notNull(),
  },
  (table) => [uniqueIndex("transactions_client_uuid_idx").on(table.clientUuid)]
);

export const redemptions = pgTable("redemptions", {
  cardId: text("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  cashierId: text("cashier_id").references(() => cashiers.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  id: text("id").primaryKey(),
  rewardId: text("reward_id").references(() => rewards.id, {
    onDelete: "set null",
  }),
  staffUserId: text("staff_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
});

export const subscriptions = pgTable("subscriptions", {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  paidUntil: timestamp("paid_until").notNull(),
});
