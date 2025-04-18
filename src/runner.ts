import { ESLint } from "eslint";
import path from "path";
import { getAppOctokit } from "./authenticateApp";
import { loadEslintFlatConfig } from "./loadEslintConfig";

export async function runDocEnhancer(
  appId: number,
  privateKey: string,
  installationId: number,
  owner: string,
  repo: string,
  prNumber: number
) {
  const octokit = getAppOctokit(appId, privateKey, installationId);
  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  const backendDir = path.join(workspace, "backend");

  const overrideConfig = await loadEslintFlatConfig(); // pass path
  const eslint = new ESLint({
    cwd: backendDir,
    overrideConfig: Array.isArray(overrideConfig)
      ? overrideConfig[0]
      : overrideConfig,
    cache: false,
  });

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
      .filter((f) => f.endsWith(".ts") && f.startsWith("backend/"))
      .map((f) => f.replace(/^backend\//, ""));

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
