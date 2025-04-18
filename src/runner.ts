// src/runner.ts
import path from "path";
import url from "url";
import { ESLint } from "eslint";
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

  // ─── load your flat ESM config ──────────────────────────
  const configPath = path.join(backendDir, "eslint.config.mjs");
  const { default: flat } = await import(url.pathToFileURL(configPath).href);
  // if you exported an array, pick the first config
  const overrideConfig = Array.isArray(flat) ? flat[0] : flat;

  // ─── instantiate ESLint with your config object ─────────
  const eslint = new ESLint({
    cwd: backendDir,
    overrideConfig, // your flat-config object
    cache: false,
  });

  // ─── now the rest remains unchanged ────────────────────
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
