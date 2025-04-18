import path from "path";
import { ESLint } from "eslint";
import { createRequire } from "module"; // ✅ THIS is key
import { getAppOctokit } from "./authenticateApp";

export async function runDocEnhancer(
  appId: number,
  privateKey: string,
  installationId: number,
  owner: string,
  repo: string,
  prNumber: number
) {
  const octokit = getAppOctokit(appId, privateKey, installationId);

  // ─── locate backend workspace ───────────────────────────
  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  const backendDir = path.join(workspace, "backend");

  // ─── load your flat ESM config (with createRequire) ─────
  const require = createRequire(__filename);
  const configPath = path.join(backendDir, "eslint.config.mjs");

  let flat: any;
  try {
    flat = require(configPath);
  } catch (err) {
    console.error(`❌ Failed to load ESLint config from: ${configPath}`);
    throw err;
  }

  const overrideConfig = Array.isArray(flat) ? flat[0] : flat;
  console.log("✅ ESLint config loaded:", configPath);

  // ─── instantiate ESLint with your config object ─────────
  const eslint = new ESLint({
    cwd: backendDir,
    overrideConfig,
    cache: false,
  });

  // ─── fetch commits and existing comments ─────────────────
  const { data: commits } = await octokit.pulls.listCommits({
    owner,
    repo,
    pull_number: prNumber,
  });
  const { data: comments } = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
  });

  for (const commit of commits) {
    const sha = commit.sha;
    const shortSha = sha.slice(0, 7);

    if (comments.some((c) => c.body?.includes(`\`${shortSha}\``))) {
      console.log(`⏭️ Skipping ${shortSha}`);
      continue;
    }

    console.log(`🔍 Processing ${shortSha}`);
    const { data: commitData } = await octokit.repos.getCommit({
      owner,
      repo,
      ref: sha,
    });

    const changed = (commitData.files ?? [])
      .map((f) => f.filename)
      .filter((fn) => fn.endsWith(".ts") && fn.startsWith("backend/"))
      .map((fn) => fn.replace(/^backend\//, ""));

    if (!changed.length) {
      console.log(`ℹ️ No backend .ts changes in ${shortSha}`);
      continue;
    }

    const results = await eslint.lintFiles(changed);
    const formatter = await eslint.loadFormatter("stylish");
    const output = formatter.format(results);
    const hasErrors = results.some((r) => r.errorCount > 0);

    const body = hasErrors
      ? `### ❌ ESLint issues in commit \`${shortSha}\`:\n\`\`\`ts\n${output}\n\`\`\``
      : `### ✅ No ESLint errors in commit \`${shortSha}\`.`;

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    });
    console.log(`💬 Commented for ${shortSha}`);
  }
}
