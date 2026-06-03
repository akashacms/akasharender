---
title: "Semantic Search"
type: concept
Sources:
  - lib/cache/sql/doc-search-semantic.sql
  - lib/cache/cache-sqlite.ts
  - lib/cli.ts
Categories:
  - search
  - machine-learning
  - semantic
date-created: 2026-05-21T03:00:00+00:00
last-updated: 2026-05-21T03:00:00+00:00
confidence: high
---

# Semantic Search

## Definition

Semantic Search is a content discovery feature that finds documents based on meaning and conceptual similarity rather than keyword matching, using machine learning-generated vector embeddings to compare the semantic distance between a search query and document content. Users can search with natural language questions or descriptions, and the system returns the 10 most semantically similar documents ranked by vector similarity distance (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql), [lib/cli.ts](../../lib/cli.ts)).

## How It Works

Semantic search operates through vector similarity comparison using the sqlite-vec extension (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql)):

**Query Embedding**: The search text is converted to a 384-dimensional vector using the same ML model that embedded the documents (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql):6):
```sql
lembed($lembedModel, $searchFor)
```

**Vector Matching**: The `MATCH` operator from sqlite-vec finds the nearest neighbors in vector space (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql):6):
```sql
WHERE body_embeddings MATCH lembed($lembedModel, $searchFor)
```

This compares the query embedding against all stored document embeddings using cosine similarity or another distance metric.

**Distance Ranking**: Results are ordered by distance, with smaller distances indicating greater semantic similarity (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql):7-8):
```sql
ORDER BY distance
LIMIT 10
```

**Result Enrichment**: The query joins with the DOCUMENTS table to provide full document metadata alongside distance scores (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql):10-14):
```sql
SELECT matches.vpath, distance
FROM matches
LEFT JOIN DOCUMENTS ON DOCUMENTS.vpath = matches.vpath
```

**CLI Access**: The `docs-semantic <configFN> <searchFor>` command provides command-line access to semantic search (source: [lib/cli.ts](../../lib/cli.ts)).

**CTE Pattern**: Uses Common Table Expression (WITH clause) for cleaner SQL organization, first finding matches then enriching with document data (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql):1-14).

## Key Parameters

**$lembedModel**: Model name parameter used for embedding the search query, must match the model used for document embeddings (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql):6).

**$searchFor**: Text string to search for, can be a query, question, or description (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql):6).

**LIMIT 10**: Number of results returned, hardcoded to top 10 most similar documents (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql):8).

**distance**: Numeric similarity score between query and document, lower values indicate higher similarity (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql):4,7,12).

**body_embeddings**: Vector column being searched, contains 384-dimensional document embeddings (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql):6).

**vpath**: Document virtual path returned as the primary result identifier (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql):3,11).

## When To Use

**Natural Language Queries**: When users want to search with questions like "how to configure plugins" instead of keyword searches (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql)).

**Concept-Based Discovery**: Find documents about a concept even when they use different terminology (e.g., searching "machine learning" finds "AI" and "neural networks") (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql)).

**Related Content**: Generate "related articles" recommendations by searching with document content to find similar documents (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql)).

**Synonym Insensitive**: Search works across synonyms and paraphrases without requiring explicit synonym dictionaries (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql)).

**Cross-Language**: With multilingual models, can find documents in different languages that discuss similar concepts (requires appropriate model) (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql)).

## Risks & Pitfalls

**Requires Configuration**: Semantic search only works when vector embeddings are enabled via environment variables. Silent failure if not configured (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql)).

**Fixed Result Count**: Hardcoded LIMIT 10 means you can't request more or fewer results without modifying the SQL (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql):8).

**No Filters**: Query doesn't support filtering by date, tags, or other metadata. Returns top 10 globally, not within categories (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql)).

**Distance Interpretation**: Distance values are not normalized to 0-1 range or percentages. Users must learn what "good" distances look like for their content (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql):4,12).

**Model Dependency**: Search quality depends entirely on embedding model quality. Poor models produce poor results (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql):6).

**Query Length Limits**: Very long search queries may exceed model input limits or produce poor embeddings (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql):6).

**No Result Snippets**: Returns only vpath and distance, not excerpt or title. Must perform additional lookups for display (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql):11-12).

**Cold Start Problem**: Semantic search quality improves with more documents. Small sites may not have enough content for meaningful results (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql)).

**Performance**: Computing query embedding and comparing against all documents is slower than keyword search. May need optimization for large sites (source: [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql)).

## Sources

- [lib/cache/sql/doc-search-semantic.sql](../../lib/cache/sql/doc-search-semantic.sql) - Semantic search SQL query
- [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts) - Documents cache with semantic search
- [lib/cli.ts](../../lib/cli.ts) - CLI semantic search command

## Related Pages

- [Vector Embeddings](./vector-embeddings.md) - Underlying vector representation
- [Database Extensions](./database-extensions.md) - sqlite-vec and sqlite-lembed enabling search
- [SQLite Database](./sqlite-database.md) - Database hosting vectors
- [Command-Line Interface](./command-line-interface.md) - CLI access to search

## Backlinks
