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
exports.runDocEnhancer = runDocEnhancer;
// src/runner.ts
const rest_1 = require("@octokit/rest");
const path = __importStar(require("path"));
async function runDocEnhancer(openaiKey, githubToken, owner, repo, prNumber) {
    const octokit = new rest_1.Octokit({ auth: githubToken });
    const { data: files } = await octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber,
    });
    const backendFiles = files
        .map((f) => f.filename)
        .filter((f) => f.startsWith("backend/") &&
        (f.endsWith(".controller.ts") || f.endsWith(".dto.ts")));
    console.log("Detected backend files:", backendFiles);
    // חיפוש קובץ הסרוויס התואם לכל controller
    const controllers = backendFiles.filter((f) => f.endsWith(".controller.ts"));
    for (const controllerPath of controllers) {
        const baseName = path.basename(controllerPath).replace(".controller.ts", "");
        const servicePath = controllerPath.replace(`${baseName}.controller.ts`, `${baseName}.service.ts`);
        console.log(`🔎 Looking for matching service: ${servicePath}`);
        const matchingFile = files.find((f) => f.filename === servicePath);
        if (matchingFile) {
            console.log(`✅ Found service for ${controllerPath}: ${servicePath}`);
        }
        else {
            console.log(`⚠️ No matching service found for ${controllerPath}`);
        }
    }
    // בהמשך נוסיף שליחת הקבצים ל-GPT והחזרה עם דוקומנטציה
}
