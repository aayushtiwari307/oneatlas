import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { prisma } from "../src/lib/db";
import { runCuratedIngestion } from "../src/server/ingestion/run";

async function main(): Promise<void> {
  const dataDirectory = resolve(process.cwd(), "data", "curated");
  const [labs, providers, benchmarks, models, scores] = await Promise.all([
    readFile(resolve(dataDirectory, "labs.json"), "utf8"),
    readFile(resolve(dataDirectory, "providers.json"), "utf8"),
    readFile(resolve(dataDirectory, "benchmarks.json"), "utf8"),
    readFile(resolve(dataDirectory, "models.json"), "utf8"),
    readFile(resolve(dataDirectory, "scores.json"), "utf8"),
  ]);

  const summary = await runCuratedIngestion(prisma, {
    labs: JSON.parse(labs) as unknown,
    providers: JSON.parse(providers) as unknown,
    benchmarks: JSON.parse(benchmarks) as unknown,
    models: JSON.parse(models) as unknown,
    scores: JSON.parse(scores) as unknown,
  });

  console.log("Curated seed completed:", summary);
}

main()
  .catch((error: unknown) => {
    console.error("Curated seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
