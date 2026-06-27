const CURSOR_PREFIX = "v1:";

export function encodeProductCursor(documentId: string): string {
  return Buffer.from(`${CURSOR_PREFIX}${documentId}`, "utf8").toString(
    "base64url",
  );
}

export function decodeProductCursor(cursor: string): string {
  const decoded = Buffer.from(cursor, "base64url").toString("utf8");

  if (!decoded.startsWith(CURSOR_PREFIX)) {
    throw new Error("Invalid cursor");
  }

  const documentId = decoded.slice(CURSOR_PREFIX.length);

  if (!documentId) {
    throw new Error("Invalid cursor");
  }

  return documentId;
}
