# Curated seed catalogue — data provenance

This directory is an **offline demo fixture**, not a live pricing or benchmark feed.

## Included records

- 15 AI labs / model organizations.
- 10 inference and routing providers.
- 8 benchmark definitions across knowledge, reasoning, coding, math, multimodal, general and agentic categories.
- 62 model catalogue entries.
- 80 benchmark score rows covering 50 models.

## What is and is not verified

- Lab and provider names and homepages are directory references. A listed provider association does **not** assert that the provider currently serves that model.
- Benchmark names and `sourceUrl` values point to the benchmark's public paper, project or leaderboard page. The numeric values in `scores.json` are synthetic demo values; every row uses `source: "illustrative"`.
- Model names are intended as recognizable public model-family examples. The release dates, context windows, output limits, modalities, capabilities, open-weight flags, descriptions, provider associations, latency, throughput, quantization and all offering prices in `models.json` are **illustrative fixture metadata**. They are not vendor specifications or quotes.
- The agreed curated JSON contract has a `source` field for benchmark scores, but no per-model or per-offering source field. This README is therefore the explicit provenance notice for those fixture-only fields. Do not remove this notice or present these values as published facts.
- The optional OpenRouter ingestion is the path for real, freshly retrieved model and pricing metadata. It must preserve curated rows and must not convert illustrative benchmark scores into real scores.

Before production use, refresh names/availability against provider catalogs, replace illustrative specifications and prices with cited sources, and replace scores only with source-backed benchmark results. The UI must keep its general **illustrative data** notice and must label benchmark pages accordingly while any illustrative score rows remain.
