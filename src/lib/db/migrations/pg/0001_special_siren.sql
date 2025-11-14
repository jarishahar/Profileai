ALTER TABLE "knowledge_base" DROP CONSTRAINT "knowledge_base_project_id_project_id_fk";
--> statement-breakpoint
DROP INDEX "kb_project_id_idx";--> statement-breakpoint
DROP INDEX "kb_user_project_idx";--> statement-breakpoint
CREATE INDEX "kb_user_project_idx" ON "knowledge_base" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "knowledge_base" DROP COLUMN "project_id";