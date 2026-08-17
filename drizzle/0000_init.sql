-- Schema inicial do app de Solicitação de Boletos (Nova Medtec Cirúrgica).
-- Pode ser rodado diretamente no SQL Editor do Neon, ou aplicado com
-- `npm run db:push` (drizzle-kit) depois de configurar DATABASE_URL.

CREATE TYPE "user_role" AS ENUM ('admin');
CREATE TYPE "boleto_status" AS ENUM ('pending', 'in_review', 'done');
CREATE TYPE "boleto_payment_type" AS ENUM ('cash', 'installments');

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "display_name" VARCHAR(255) NOT NULL,
  "role" "user_role" NOT NULL DEFAULT 'admin',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "user_passwords" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "password_hash" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "sessions" (
  "id" TEXT PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "last_accessed" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "expires_at" TIMESTAMPTZ NOT NULL
);

CREATE TABLE "boleto_requests" (
  "id" SERIAL PRIMARY KEY,
  "status" "boleto_status" NOT NULL DEFAULT 'pending',
  "store_name" VARCHAR(255) NOT NULL,
  "client_name" VARCHAR(255) NOT NULL,
  "client_document" VARCHAR(32) NOT NULL,
  "due_date" DATE NOT NULL,
  "invoice_number" VARCHAR(100) NOT NULL,
  "invoice_file_url" TEXT,
  "invoice_file_pathname" TEXT,
  "invoice_file_name" TEXT,
  "charge_reason" TEXT,
  "total_amount" NUMERIC(12, 2) NOT NULL,
  "payment_type" "boleto_payment_type" NOT NULL DEFAULT 'cash',
  "installments_count" INTEGER,
  "client_email" VARCHAR(255) NOT NULL,
  "client_phone" VARCHAR(32) NOT NULL,
  "contact_person" VARCHAR(255) NOT NULL,
  "requested_by_name" VARCHAR(255),
  "requested_by_email" VARCHAR(255),
  "admin_notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "completed_at" TIMESTAMPTZ,
  "completed_by_user_id" INTEGER REFERENCES "users"("id")
);

CREATE INDEX "boleto_requests_status_idx" ON "boleto_requests" ("status");
CREATE INDEX "boleto_requests_store_name_idx" ON "boleto_requests" ("store_name");
CREATE INDEX "boleto_requests_created_at_idx" ON "boleto_requests" ("created_at");
