ALTER TABLE "embedding" ALTER COLUMN "embedding" SET DATA TYPE vector(256);--> statement-breakpoint
ALTER TABLE "knowledge_base" ALTER COLUMN "embedding_dimension" SET DEFAULT 256;