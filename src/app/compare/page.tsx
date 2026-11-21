import type { Metadata } from "next";
import { CompareWorkspace } from "@/components/compare/compare-workspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compare AI models",
  description: "Compare AI model specifications, provider pricing and benchmark results side by side.",
};

export default function ComparePage() {
  return <CompareWorkspace />;
}
