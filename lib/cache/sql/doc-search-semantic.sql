WITH matches AS (
  SELECT
    vpath,
    distance
  FROM vec_documents
  WHERE body_embeddings MATCH lembed($lembedModel, $searchFor)
  ORDER BY distance
  LIMIT 10
)
SELECT
  matches.vpath,
  distance
FROM matches
LEFT JOIN DOCUMENTS ON DOCUMENTS.vpath = matches.vpath;