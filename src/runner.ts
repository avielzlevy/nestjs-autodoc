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
  const results = await eslint.lintFiles(["src/**/*.ts"]);
  const formatter = await eslint.loadFormatter("stylish");
  const output = formatter.format(results);

  const hasErrors = results.some((r) => r.errorCount > 0);

  const body = hasErrors
    ? `### ❌ ESLint found issues in Swagger decorators:
\\\`\`\`ts
${output}
\\\`\`\`
Please fix the above issues and re-run the workflow.`
    : `✅ No ESLint errors found.`;

  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
}
