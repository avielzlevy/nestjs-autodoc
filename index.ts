// index.ts
import * as core from "@actions/core";
import * as github from "@actions/github";
import { runDocEnhancer } from "./src/runner";

(async () => {
  try {
    const appId = Number(core.getInput("gh_app_id", { required: true }));
    const privateKey = core.getInput("gh_app_private_key", { required: true });
    const installationId = Number(core.getInput("gh_app_installation_id", { required: true }));

    const context = github.context;

    if (!context.payload.pull_request) {
      core.setFailed("No pull request context found.");
      return;
    }

    const prNumber = context.payload.pull_request.number;
    const repo = context.repo;

    console.log(
      `Running ESLint doc check on PR #${prNumber} in ${repo.owner}/${repo.repo}`
    );

    await runDocEnhancer(
      appId,
      privateKey,
      installationId,
      repo.owner,
      repo.repo,
      prNumber
    );
  } catch (error: any) {
    console.error("Error:", error);
    core.setFailed(error.message);
  }
})();
