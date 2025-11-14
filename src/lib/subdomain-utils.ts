/**
 * Utility functions for subdomain management
 */

/**
 * Generate a URL-safe subdomain from agent name and project identifier
 * Format: {agentname-slugified}-{first-8-chars-of-projectid}
 * Example: "SalesPerson" + "proj123" → "salesperson-proj1234"
 */
export function generateSubdomain(
  agentName: string,
  projectId: string,
): string {
  // Slugify agent name: lowercase, remove special chars, replace spaces with hyphens
  const slugifiedName = agentName
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();

  // Take first 8 characters of project ID for uniqueness
  const projectIdentifier = projectId.substring(0, 8);

  return `${slugifiedName}-${projectIdentifier}`;
}

/**
 * Validate subdomain format
 * Must be: alphanumeric + hyphens, 3-63 characters, no leading/trailing hyphens
 */
export function isValidSubdomain(subdomain: string): boolean {
  const subdomainRegex = /^(?!-)[a-z0-9-]{3,63}(?<!-)$/i;
  return subdomainRegex.test(subdomain);
}

/**
 * Parse subdomain to extract agent identifier and project identifier
 * Example: "salesperson-proj1234" → { agentIdentifier: "salesperson", projectId: "proj1234" }
 */
export function parseSubdomain(subdomain: string): {
  agentIdentifier: string;
  projectIdentifier: string;
} | null {
  const parts = subdomain.split("-");

  if (parts.length < 2) {
    return null;
  }

  // Last part is project identifier (8 chars), rest is agent identifier
  const projectIdentifier = parts.pop() || "";
  const agentIdentifier = parts.join("-");

  if (!agentIdentifier || !projectIdentifier) {
    return null;
  }

  return { agentIdentifier, projectIdentifier };
}
