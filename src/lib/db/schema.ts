import {
  pgTable,
  pgEnum,
  serial,
  text,
  varchar,
  timestamp,
  numeric,
  integer,
  date,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin"]);
export const boletoStatusEnum = pgEnum("boleto_status", [
  "pending",
  "in_review",
  "done",
]);
export const boletoPaymentTypeEnum = pgEnum("boleto_payment_type", [
  "cash",
  "installments",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userPasswords = pgTable("user_passwords", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastAccessed: timestamp("last_accessed", { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const boletoRequests = pgTable("boleto_requests", {
  id: serial("id").primaryKey(),
  status: boletoStatusEnum("status").notNull().default("pending"),
  storeName: varchar("store_name", { length: 255 }).notNull(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientDocument: varchar("client_document", { length: 32 }).notNull(),
  dueDate: date("due_date", { mode: "date" }).notNull(),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull(),
  invoiceFileUrl: text("invoice_file_url"),
  invoiceFilePathname: text("invoice_file_pathname"),
  invoiceFileName: text("invoice_file_name"),
  chargeReason: text("charge_reason"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  paymentType: boletoPaymentTypeEnum("payment_type").notNull().default("cash"),
  installmentsCount: integer("installments_count"),
  clientEmail: varchar("client_email", { length: 255 }).notNull(),
  clientPhone: varchar("client_phone", { length: 32 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }).notNull(),
  requestedByName: varchar("requested_by_name", { length: 255 }),
  requestedByEmail: varchar("requested_by_email", { length: 255 }),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  completedByUserId: integer("completed_by_user_id").references(
    () => users.id
  ),
});

export type User = typeof users.$inferSelect;
export type BoletoRequest = typeof boletoRequests.$inferSelect;
export type NewBoletoRequest = typeof boletoRequests.$inferInsert;
export type BoletoStatus = (typeof boletoStatusEnum.enumValues)[number];
export type BoletoPaymentType =
  (typeof boletoPaymentTypeEnum.enumValues)[number];
