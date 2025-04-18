import path from "path";
import { pathToFileURL } from "url";
import { createRequire } from "module";

export function loadEslintFlatConfig(backendDir: string): any {
  const configPath = path.resolve(backendDir, "eslint.config.cjs");
  const requireFromRuntime = createRequire(__filename);
  console.log(`✅ ESLint config loaded: ${configPath}`);
  return requireFromRuntime(configPath);
}
