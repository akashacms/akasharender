INSERT INTO vec_documents(
    vpath,
    -- Ignore this for now
    -- title_embeddings,
    body_embeddings
) VALUES (
    $vpath,
    -- lembed($lembedModel, $titleEmbed),
    lembed($lembedModel, $bodyEmbed)
);