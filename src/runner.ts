// src/runner.ts
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
  const eslint = new ESLint({});

  // 1. get all commits in the PR
  const { data: commits } = await octokit.pulls.listCommits({
    owner,
    repo,
    pull_number: prNumber,
  });

  // 2. get all existing comments on the PR
  const { data: comments } = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
  });

  for (const commit of commits) {
    const sha = commit.sha;
    const shortSha = sha.slice(0, 7);

    // 3. check if we already commented on this commit
    const alreadyCommented = comments.some((c) =>
      c.body?.includes(`\`${shortSha}\``)
    );
    if (alreadyCommented) {
      console.log(`⏭️ Skipping commit ${shortSha} – already commented.`);
      continue;
    }

    console.log(`🔍 Processing commit ${shortSha}`);

    // 4. fetch the list of files changed in this commit
    const { data: commitData } = await octokit.repos.getCommit({
      owner,
      repo,
      ref: sha,
    });

    const changedFiles =
      commitData.files
        ?.map((f) => f.filename)
        .filter((fn) => fn.endsWith(".ts"))
        .filter((fn) => fn.startsWith("backend/")) || [];

    if (changedFiles.length === 0) {
      console.log(`ℹ️  No .ts files changed in commit ${shortSha}, skipping.`);
      continue;
    }

    // 5. run ESLint on only those changed files
    const results = await eslint.lintFiles(changedFiles);
    const formatter = await eslint.loadFormatter("stylish");
    const output = formatter.format(results);
    const hasErrors = results.some((r) => r.errorCount > 0);

    // 6. build a comment that includes the commit SHA
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
