export type AvatarPersonaMetadata = Record<string, unknown> & {
  persona?: string;
  gender?: string;
  ageRange?: string;
  style?: string;
  vibe?: string;
  toneTags?: string[];
  nicheTags?: string[];
  traits?: string[];
  characterSheet?: {
    lookPrompt: string;
    vibeTone: string;
    faceAnchor: string;
    wardrobe: string;
    shotGuidance: string;
  };
  generation?: {
    provider: string;
    model: string;
    featureFlagEnabled: boolean;
    generatedAt: string;
  };
};

export type AvatarMetadataFilters = {
  persona?: string;
  gender?: string;
  style?: string;
  tone?: string;
  niche?: string;
};

export type AvatarFilterOptions = {
  personas: string[];
  genders: string[];
  styles: string[];
  tones: string[];
  niches: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];

  return typeof value === "string" ? value : undefined;
}

function readStringArray(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function includesTag(values: string[] | undefined, expected?: string) {
  if (!expected) {
    return true;
  }

  return (values ?? []).some(
    (value) => value.toLowerCase() === expected.toLowerCase(),
  );
}

export function normalizeAvatarPersonaMetadata(
  metadata: Record<string, unknown>,
): AvatarPersonaMetadata {
  const characterSheet = isRecord(metadata.characterSheet)
    ? {
        lookPrompt:
          readString(metadata.characterSheet, "lookPrompt") ??
          "No look prompt saved.",
        vibeTone:
          readString(metadata.characterSheet, "vibeTone") ??
          readString(metadata, "vibe") ??
          "No vibe saved.",
        faceAnchor:
          readString(metadata.characterSheet, "faceAnchor") ??
          "Consistent face reference pending.",
        wardrobe:
          readString(metadata.characterSheet, "wardrobe") ??
          "Wardrobe guidance pending.",
        shotGuidance:
          readString(metadata.characterSheet, "shotGuidance") ??
          "Character sheet framing pending.",
      }
    : undefined;

  const generation = isRecord(metadata.generation)
    ? {
        provider: readString(metadata.generation, "provider") ?? "unknown",
        model: readString(metadata.generation, "model") ?? "unknown",
        featureFlagEnabled:
          metadata.generation.featureFlagEnabled === true ? true : false,
        generatedAt:
          readString(metadata.generation, "generatedAt") ??
          new Date(0).toISOString(),
      }
    : undefined;

  return {
    ...metadata,
    persona: readString(metadata, "persona"),
    gender: readString(metadata, "gender"),
    ageRange: readString(metadata, "ageRange"),
    style: readString(metadata, "style"),
    vibe: readString(metadata, "vibe"),
    toneTags: readStringArray(metadata, "toneTags"),
    nicheTags: readStringArray(metadata, "nicheTags"),
    traits: readStringArray(metadata, "traits"),
    characterSheet,
    generation,
  };
}

export function avatarMatchesMetadataFilters(
  metadata: Record<string, unknown>,
  filters: AvatarMetadataFilters,
) {
  const normalized = normalizeAvatarPersonaMetadata(metadata);

  if (filters.persona && normalized.persona !== filters.persona) {
    return false;
  }

  if (filters.gender && normalized.gender !== filters.gender) {
    return false;
  }

  if (filters.style && normalized.style !== filters.style) {
    return false;
  }

  if (!includesTag(normalized.toneTags, filters.tone)) {
    return false;
  }

  return includesTag(normalized.nicheTags, filters.niche);
}

export function buildAvatarFilterOptions(
  metadataItems: Record<string, unknown>[],
): AvatarFilterOptions {
  const personas = new Set<string>();
  const genders = new Set<string>();
  const styles = new Set<string>();
  const tones = new Set<string>();
  const niches = new Set<string>();

  for (const item of metadataItems) {
    const metadata = normalizeAvatarPersonaMetadata(item);

    if (metadata.persona) {
      personas.add(metadata.persona);
    }

    if (metadata.gender) {
      genders.add(metadata.gender);
    }

    if (metadata.style) {
      styles.add(metadata.style);
    }

    for (const tone of metadata.toneTags ?? []) {
      tones.add(tone);
    }

    for (const niche of metadata.nicheTags ?? []) {
      niches.add(niche);
    }
  }

  return {
    personas: [...personas].sort(),
    genders: [...genders].sort(),
    styles: [...styles].sort(),
    tones: [...tones].sort(),
    niches: [...niches].sort(),
  };
}
