INSERT INTO vec_documents(
   vpath,
   body_embeddings
)  VALUES (
   $vpath,
   lembed($lembedModel, $bodyEmbed)
);

-- select $vpath, lembed($lembedModel, $bodyEmbed);
