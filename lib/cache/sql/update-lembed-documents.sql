UPDATE DOCUMENTS
SET 
    -- Ignore this for now
    -- title_embeddings = lembed($lembedModel, $titleEmbed),
    body_embeddings  = lembed($lembedModel, $bodyEmbed)
WHERE
    vpath = $vpath;