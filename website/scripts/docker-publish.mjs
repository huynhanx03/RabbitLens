import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const websiteRoot = resolve(scriptDirectory, "..");
const repositoryRoot = resolve(websiteRoot, "..");
const packagePath = resolve(websiteRoot, "package.json");
const { version } = JSON.parse(readFileSync(packagePath, "utf8"));
const image = process.env.RABBITLENS_IMAGE ?? "ghcr.io/huynhanx03/rabbitlens";
const platforms = process.env.RABBITLENS_PLATFORMS ?? "linux/amd64,linux/arm64";
const revision = process.env.RABBITLENS_REVISION ?? gitRevision();
const dryRun = process.argv.slice(2).includes("--dry-run");

const args = [
  "buildx",
  "build",
  "--platform",
  platforms,
  "--file",
  "website/Dockerfile",
  "--tag",
  `${image}:${version}`,
  "--tag",
  `${image}:latest`,
  "--label",
  "org.opencontainers.image.source=https://github.com/huynhanx03/RabbitLens",
  "--label",
  `org.opencontainers.image.revision=${revision}`,
  "--label",
  `org.opencontainers.image.version=${version}`,
  "--push",
  "website",
];

if (dryRun) {
  console.log(["docker", ...args].map(shellEscape).join(" "));
} else {
  const result = spawnSync("docker", args, {
    cwd: repositoryRoot,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  process.exitCode = result.status ?? 1;
}

function gitRevision() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });

  return result.status === 0 ? result.stdout.trim() : "unknown";
}

function shellEscape(value) {
  return /[^A-Za-z0-9_/:=.,-]/.test(value)
    ? `'${value.replaceAll("'", "'\\\"'\\\"'")}'`
    : value;
}
