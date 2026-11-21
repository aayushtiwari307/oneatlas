import type { Metadata } from "next";
import { RankingsExplorer } from "@/components/rankings/rankings-explorer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Model rankings",
  description:
    "Explore AI model rankings across knowledge, reasoning, coding, mathematics and multimodal benchmarks.",
};

export default function RankingsPage() {
  return <RankingsExplorer />;
}
