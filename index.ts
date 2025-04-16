// index.ts
import * as core from '@actions/core';
import * as github from '@actions/github';
import { runDocEnhancer } from './src/runner';

(async () => {
  try {
    const openaiKey = core.getInput('openai_key', { required: true });
    const token = core.getInput('github_token', { required: true });
    const context = github.context;

    if (!context.payload.pull_request) {
      core.setFailed('No pull request context found.');
      return;
    }

    const prNumber = context.payload.pull_request.number;
    const repo = context.repo;

    console.log(`Running doc enhancer on PR #${prNumber} in ${repo.owner}/${repo.repo}`);

    await runDocEnhancer(openaiKey, repo.owner, repo.repo, prNumber);
  } catch (error: any) {
    console.error('Error:', error);
    core.setFailed(error.message);
  }
})();