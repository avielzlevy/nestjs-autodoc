"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// index.ts
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const runner_1 = require("./src/runner");
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
        await (0, runner_1.runDocEnhancer)(openaiKey, token, repo.owner, repo.repo, prNumber);
    }
    catch (error) {
        console.error('Error:', error);
        core.setFailed(error.message);
    }
})();
