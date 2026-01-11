
-- Support sqlite_vec and sqlite_lembed
CREATE VIRTUAL TABLE IF NOT EXISTS vec_documents USING vec0(
        vpath TEXT,
        -- Ignore this for now
        -- title_embeddings FLOAT[384],
        body_embeddings  FLOAT[384]
);
-- CREATE INDEX "vec_body"
--         ON "vec_documents" ("body_embeddings");
