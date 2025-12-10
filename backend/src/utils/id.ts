export function toBigInt(id: string | number | bigint | null | undefined): bigint {
  if (id === null || id === undefined) throw new Error("Missing id");
  if (typeof id === "bigint") return id;
  if (typeof id === "number") return BigInt(id);
  const trimmed = String(id).trim();
  if (!trimmed) throw new Error("Invalid id");
  return BigInt(trimmed);
}

