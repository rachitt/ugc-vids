import { and, asc, desc, eq, or, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import { avatars } from "@/lib/db/schema";
import {
  CREDIT_COSTS,
  debitCreditsWithinTransaction,
} from "@/lib/credits";

import {
  avatarMatchesMetadataFilters,
  buildAvatarFilterOptions,
  normalizeAvatarPersonaMetadata,
  type AvatarFilterOptions,
  type AvatarMetadataFilters,
} from "./types";
import {
  buildCharacterSheetPersonaMetadata,
  getCharacterImageGenerator,
  type CharacterImageGenerationInput,
} from "./generator";

export const AVATAR_KINDS = ["library", "custom"] as const;

export type AvatarKind = (typeof AVATAR_KINDS)[number];
export type AvatarRow = typeof avatars.$inferSelect;

export type AvatarListFilters = AvatarMetadataFilters & {
  kind?: AvatarKind;
  workspaceId?: string;
};

export type AvatarListResult = {
  avatars: AvatarRow[];
  filterOptions: AvatarFilterOptions;
};

export type CreateCustomAvatarInput = CharacterImageGenerationInput;

export type CreateCustomAvatarResult = {
  avatar: AvatarRow;
  creditsDebited: number;
  balanceAfter: number;
};

export class CustomAvatarValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomAvatarValidationError";
  }
}

function normalizeRequiredText(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new CustomAvatarValidationError(`${label} is required.`);
  }

  return normalized;
}

function buildAvatarWhere(filters: AvatarListFilters) {
  const conditions: SQL[] = [];

  if (filters.kind) {
    conditions.push(eq(avatars.kind, filters.kind));
  }

  if (filters.workspaceId) {
    const workspaceVisibility = or(
      eq(avatars.kind, "library"),
      eq(avatars.workspaceId, filters.workspaceId),
    );

    if (workspaceVisibility) {
      conditions.push(workspaceVisibility);
    }
  }

  return and(...conditions);
}

export function parseAvatarKind(value: string | undefined) {
  return AVATAR_KINDS.find((kind) => kind === value);
}

export async function listAvatars(
  filters: AvatarListFilters = {},
): Promise<AvatarListResult> {
  const where = buildAvatarWhere(filters);
  const rows = await db
    .select()
    .from(avatars)
    .where(where)
    .orderBy(asc(avatars.kind), asc(avatars.name), desc(avatars.createdAt));

  const filteredRows = rows.filter((avatar) =>
    avatarMatchesMetadataFilters(avatar.personaMetadata, filters),
  );

  return {
    avatars: filteredRows,
    filterOptions: buildAvatarFilterOptions(
      rows.map((avatar) => avatar.personaMetadata),
    ),
  };
}

export function getAvatarDisplayMetadata(avatar: AvatarRow) {
  return normalizeAvatarPersonaMetadata(avatar.personaMetadata);
}

export async function createCustomAvatar(
  input: CreateCustomAvatarInput,
): Promise<CreateCustomAvatarResult> {
  const normalizedInput = {
    workspaceId: normalizeRequiredText(input.workspaceId, "Workspace"),
    name: normalizeRequiredText(input.name, "Name"),
    lookPrompt: normalizeRequiredText(input.lookPrompt, "Look prompt"),
    vibeTone: normalizeRequiredText(input.vibeTone, "Vibe/tone"),
  };

  const generator = getCharacterImageGenerator();
  const generation = await generator.generateCharacterSheet(normalizedInput);
  const creditsDebited = generation.imageUrls.length * CREDIT_COSTS.image;
  const personaMetadata = buildCharacterSheetPersonaMetadata(
    normalizedInput,
    generation,
  );

  return db.transaction(async (tx) => {
    const debit = await debitCreditsWithinTransaction(tx, {
      workspaceId: normalizedInput.workspaceId,
      amount: creditsDebited,
      reason: "custom_avatar_image_generation",
      metadata: {
        imageCount: generation.imageUrls.length,
        creditCostPerImage: CREDIT_COSTS.image,
        generatorProvider: generation.provider,
      },
    });

    const [avatar] = await tx
      .insert(avatars)
      .values({
        workspaceId: normalizedInput.workspaceId,
        kind: "custom",
        name: normalizedInput.name,
        imageUrls: generation.imageUrls,
        personaMetadata,
      })
      .returning();

    if (!avatar) {
      throw new Error("Failed to create custom avatar.");
    }

    return {
      avatar,
      creditsDebited,
      balanceAfter: debit.balanceAfter,
    };
  });
}
