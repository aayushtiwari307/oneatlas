import { Prisma, Modality, Capability } from "@prisma/client";

/** Convert the per-token decimal strings returned by OpenRouter to USD/1M. */
export function normalizePricePerToken(pricePerToken: string): Prisma.Decimal {
  let tokenPrice: Prisma.Decimal;

  try {
    tokenPrice = new Prisma.Decimal(pricePerToken.trim());
  } catch {
    throw new Error("Invalid token price: expected a finite non-negative decimal string");
  }

  // OpenRouter can use a negative sentinel (for example "-1") for dynamic or
  // unavailable pricing. Never turn that sentinel into a sellable price.
  if (!tokenPrice.isFinite() || tokenPrice.isNegative()) {
    throw new Error("Invalid token price: expected a finite non-negative decimal string");
  }

  // Decimal arithmetic avoids floating-point drift during the per-1M conversion.
  return tokenPrice.mul(1_000_000);
}

const MODALITY_MAP: Readonly<Record<string, Modality>> = {
  text: Modality.TEXT,
  image: Modality.IMAGE,
  audio: Modality.AUDIO,
  speech: Modality.AUDIO,
  transcription: Modality.AUDIO,
  video: Modality.VIDEO,
  file: Modality.FILE,
};

/** Map known OpenRouter modality strings to Prisma enum values, preserving order. */
export function normalizeModalities(sourceModalities: readonly string[]): Modality[] {
  const normalized: Modality[] = [];
  const seen = new Set<Modality>();

  for (const sourceModality of sourceModalities) {
    const modality = MODALITY_MAP[sourceModality.trim().toLowerCase()];
    if (modality && !seen.has(modality)) {
      seen.add(modality);
      normalized.push(modality);
    }
  }

  return normalized;
}

const CAPABILITY_MAP: Readonly<Record<string, Capability>> = {
  tools: Capability.TOOLS,
  reasoning: Capability.REASONING,
  include_reasoning: Capability.REASONING,
  response_format: Capability.JSON_MODE,
  structured_outputs: Capability.STRUCTURED_OUTPUT,
  web_search: Capability.WEB_SEARCH,
  code_execution: Capability.CODE_EXECUTION,
};

/**
 * Map supported_parameters to database capabilities. Vision is derived from
 * image input support, not from image output support.
 */
export function normalizeCapabilities(
  supportedParameters: readonly string[],
  inputModalities: readonly Modality[],
): Capability[] {
  const normalized: Capability[] = [];
  const seen = new Set<Capability>();

  const add = (capability: Capability) => {
    if (!seen.has(capability)) {
      seen.add(capability);
      normalized.push(capability);
    }
  };

  for (const parameter of supportedParameters) {
    const capability = CAPABILITY_MAP[parameter.trim().toLowerCase()];
    if (capability) {
      add(capability);
    }
  }

  if (inputModalities.includes(Modality.IMAGE)) {
    add(Capability.VISION);
  }

  return normalized;
}
