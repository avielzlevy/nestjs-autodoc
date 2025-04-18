// src/runner.ts
import path from "path";
import { getAppOctokit } from "./authenticateApp";
import { ESLint } from "eslint";

export async function runDocEnhancer(
  appId: number,
  privateKey: string,
  installationId: number,
  owner: string,
  repo: string,
  prNumber: number
) {
  const octokit = getAppOctokit(appId, privateKey, installationId);

  // ─── 1) Point ESLint at backend/ as its workspace ───────────────────────────
  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  const backendDir = path.join(workspace, "backend");

  const eslint = new ESLint({
    cwd: backendDir,
    cache: false,
  });

  // ─── 2) Fetch commits & existing comments ───────────────────────────────────
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

    // skip if we already commented this SHA
    const alreadyCommented = comments.some((c) =>
      c.body?.includes(`\`${shortSha}\``)
    );
    if (alreadyCommented) {
      console.log(`⏭️ Skipping commit ${shortSha} – already commented.`);
      continue;
    }

    console.log(`🔍 Processing commit ${shortSha}`);

    // fetch changed files for this commit
    const { data: commitData } = await octokit.repos.getCommit({
      owner,
      repo,
      ref: sha,
    });

    // only .ts files under backend/, then strip the "backend/" prefix
    const changedFiles = (commitData.files
      ?.map((f) => f.filename)
      .filter((fn) => fn.endsWith(".ts") && fn.startsWith("backend/"))
      .map((fn) => fn.replace(/^backend\//, "")) ) || [];

    if (changedFiles.length === 0) {
      console.log(`ℹ️  No backend .ts files changed in commit ${shortSha}, skipping.`);
      continue;
    }

    // run ESLint *from* backendDir, using your overrideConfigFile
    const results = await eslint.lintFiles(changedFiles);
    const formatter = await eslint.loadFormatter("stylish");
    const output = formatter.format(results);
    const hasErrors = results.some((r) => r.errorCount > 0);

    // build a comment including the SHA
    const body = hasErrors
      ? `### ❌ ESLint issues in commit \`${shortSha}\`:\n\`\`\`ts\n${output}\n\`\`\`\nPlease address and push again.`
      : `### ✅ No ESLint errors in commit \`${shortSha}\`.`;

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    });

    console.log(`💬 Commented for commit ${shortSha}`);
  }
}
