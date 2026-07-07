import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadManifest() {
  const manifestPath = path.resolve(
    __dirname,
    "../tests/parity/legacy-management-ui.json",
  );
  const raw = fs.readFileSync(manifestPath, "utf-8");
  return JSON.parse(raw);
}

const CAPABILITIES = new Set(["read", "create", "update", "delete", "action"]);
const API_METHODS = new Set(["GET", "POST", "PUT", "DELETE"]);
const REQUIRED_COVERED_FIELDS = [
  "sourceFile",
  "sourceRouteOrAction",
  "apiMethod",
  "apiPath",
  "rabbitLensRoute",
  "uiSurface",
  "permission",
  "implementationFiles",
  "compatibility",
  "routeModule",
  "capability",
  "category",
  "userGoal",
  "legacyBehavior",
  "rabbitLensCoverage",
];

export function verifyManifest(manifest, options = {}) {
  const errors = [];
  const keys = new Set();
  const routeCapabilities = new Set();
  const existsSync =
    options.existsSync ??
    ((file) => fs.existsSync(path.resolve(__dirname, "..", file)));
  let covered = 0;
  let excluded = 0;

  for (const entry of manifest) {
    if (keys.has(entry.sourceKey)) {
      errors.push(`Duplicate sourceKey: ${entry.sourceKey}`);
    }
    keys.add(entry.sourceKey);

    if (entry.status === "covered") {
      covered++;
      for (const field of REQUIRED_COVERED_FIELDS) {
        if (
          entry[field] == null ||
          (Array.isArray(entry[field]) && entry[field].length === 0) ||
          entry[field] === ""
        ) {
          errors.push(`Missing ${field} for covered entry: ${entry.sourceKey}`);
        }
      }
      if (!entry.sourceFile) {
        errors.push(`Missing sourceFile for covered entry: ${entry.sourceKey}`);
      } else if (!existsSync(entry.sourceFile)) {
        errors.push(
          `Source file not found for covered entry: ${entry.sourceKey}`,
        );
      }
      if (!entry.sourceRouteOrAction) {
        errors.push(
          `Missing sourceRouteOrAction for covered entry: ${entry.sourceKey}`,
        );
      }
      if (!entry.evidence || entry.evidence.length === 0) {
        errors.push(`Missing evidence for covered entry: ${entry.sourceKey}`);
      } else {
        for (const evidence of entry.evidence) {
          if (!existsSync(evidence)) {
            errors.push(
              `Evidence file not found for covered entry: ${entry.sourceKey} (${evidence})`,
            );
          }
        }
      }
      if (!entry.rabbitLensRoute) {
        errors.push(
          `Missing rabbitLensRoute for covered entry: ${entry.sourceKey}`,
        );
      }
      if (!entry.routeModule) {
        errors.push(
          `Missing routeModule for covered entry: ${entry.sourceKey}`,
        );
      } else if (!existsSync(entry.routeModule)) {
        errors.push(
          `Route module not found for covered entry: ${entry.sourceKey}`,
        );
      }
      if (!entry.capability) {
        errors.push(`Missing capability for covered entry: ${entry.sourceKey}`);
      } else if (!CAPABILITIES.has(entry.capability)) {
        errors.push(`Invalid capability for covered entry: ${entry.sourceKey}`);
      }
      if (entry.apiMethod && !API_METHODS.has(entry.apiMethod)) {
        errors.push(`Invalid apiMethod for covered entry: ${entry.sourceKey}`);
      }
      if (entry.implementationFiles) {
        for (const implementationFile of entry.implementationFiles) {
          if (!existsSync(implementationFile)) {
            errors.push(
              `Implementation file not found for covered entry: ${entry.sourceKey} (${implementationFile})`,
            );
          }
        }
      }
      if (entry.rabbitLensRoute && entry.capability) {
        const routeCapability = `${entry.rabbitLensRoute}:${entry.capability}`;
        if (routeCapabilities.has(routeCapability)) {
          errors.push(`Duplicate route capability: ${routeCapability}`);
        }
        routeCapabilities.add(routeCapability);
      }
    } else if (entry.status === "checked-source-exclusion") {
      excluded++;
      if (!entry.exclusionReason) {
        errors.push(
          `Missing exclusionReason for excluded entry: ${entry.sourceKey}`,
        );
      }
    } else {
      errors.push(`Invalid status for entry: ${entry.sourceKey}`);
    }
  }

  return { errors, covered, excluded };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const manifest = loadManifest();
    const { errors, covered, excluded } = verifyManifest(manifest);

    console.log(`Parity check complete.`);
    console.log(`Covered: ${covered}`);
    console.log(`Excluded: ${excluded}`);

    if (errors.length > 0) {
      console.error("Parity manifest verification failed:");
      errors.forEach((e) => console.error(` - ${e}`));
      process.exit(1);
    }
  } catch (err) {
    console.error("Failed to verify parity manifest:", err);
    process.exit(1);
  }
}
