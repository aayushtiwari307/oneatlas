import { prisma } from "../src/lib/db";
import { runOpenRouterIngestion } from "../src/server/ingestion/run";

runOpenRouterIngestion(prisma)
  .then((summary) => {
    console.log("OpenRouter sync completed:", summary);
  })
  .catch((error: unknown) => {
    console.error("OpenRouter sync failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
