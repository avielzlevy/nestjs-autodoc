import path from "path";

export function loadEslintFlatConfig(backendDir: string): any {
  const configPath = path.join(backendDir, "eslint.config.cjs");
  console.log(`✅ ESLint config loaded: ${configPath}`);
  return require(configPath);
}
