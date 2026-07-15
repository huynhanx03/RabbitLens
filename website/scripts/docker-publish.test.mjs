import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const scriptPath = fileURLToPath(new URL("./docker-publish.mjs", import.meta.url));
const websiteRoot = fileURLToPath(new URL("..", import.meta.url));

describe("docker publish command", () => {
  it("builds version and latest tags from package metadata without pushing", () => {
    const result = spawnSync(process.execPath, [scriptPath, "--dry-run"], {
      cwd: websiteRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        RABBITLENS_IMAGE: "registry.example/rabbitlens",
        RABBITLENS_PLATFORMS: "linux/amd64",
        RABBITLENS_REVISION: "test-revision",
      },
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /docker buildx build/);
    assert.match(result.stdout, /registry\.example\/rabbitlens:1\.0\.2/);
    assert.match(result.stdout, /registry\.example\/rabbitlens:latest/);
    assert.match(result.stdout, /--platform linux\/amd64/);
    assert.match(
      result.stdout,
      /org\.opencontainers\.image\.revision=test-revision/,
    );
    assert.match(result.stdout, /--push/);
  });
});
