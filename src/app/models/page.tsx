import type { Metadata } from "next";
import { ModelExplorer } from "@/components/models/model-explorer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore AI models",
  description: "Search and filter AI models by lab, provider, capability, modality, context window and price.",
};

export default function ModelsPage() {
  return <ModelExplorer />;
}
