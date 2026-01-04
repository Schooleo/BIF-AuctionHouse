export function maskBidderName(fullName: string): string {
  if (!fullName) return "Unknown";

  const nameParts = fullName.trim().split(" ");

  if (nameParts.length === 1) {
    // Single word name -> mask first half
    const name = nameParts[0]!;
    const maskLength = Math.ceil(name.length / 2);
    return "*".repeat(maskLength) + name.slice(maskLength);
  }

  // Multiple words -> Mask everything except last name
  const lastName = nameParts[nameParts.length - 1];

  const firstNames = nameParts.slice(0, -1);
  const totalMaskLength = firstNames.reduce(
    (sum, part) => sum + part.length,
    0
  );

  return "*".repeat(totalMaskLength + firstNames.length - 1) + " " + lastName;
}
