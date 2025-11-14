export async function verifyProfilePassword(
  password: string
): Promise<boolean> {
  const res = await fetch("/api/profile/verify-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    throw new Error("Failed to verify password");
  }

  const data = await res.json();
  return !!data.success;
}
