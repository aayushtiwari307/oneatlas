import type { Metadata } from "next";
import { LabDirectory } from "@/components/catalog/lab-directory";
import { listLabs } from "@/server/services/catalog.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Labs",
  description: "Browse AI research labs and the models in the OneAtlas catalogue.",
};

export default async function LabsPage() {
  const labs = await listLabs();
  return <LabDirectory labs={labs} />;
}
