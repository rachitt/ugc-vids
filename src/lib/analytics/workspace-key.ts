const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return uuidPattern.test(value);
}

export function normalizeWorkspacePublicKey(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  const workspaceId = trimmed.startsWith("flpk_")
    ? trimmed.slice("flpk_".length)
    : trimmed;

  if (!isUuid(workspaceId)) {
    return null;
  }

  return workspaceId.toLowerCase();
}
