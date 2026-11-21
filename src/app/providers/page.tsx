import type { Metadata } from "next";
import { ProviderDirectory } from "@/components/catalog/provider-directory";
import { listProviders } from "@/server/services/catalog.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inference Providers",
  description: "Browse inference providers and active model offerings in the OneAtlas catalogue.",
};

export default async function ProvidersPage() {
  const providers = await listProviders();
  return <ProviderDirectory providers={providers} />;
}
