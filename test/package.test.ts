import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

interface KeybindingContribution {
  command: string;
  key?: string;
  mac?: string;
  when?: string;
}

interface PackageJson {
  contributes?: {
    keybindings?: KeybindingContribution[];
  };
}

function readPackageJson(): PackageJson {
  const packageJsonPath = path.resolve(__dirname, "../package.json");
  return JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as PackageJson;
}

test("package.json contributes a global last-active-file keybinding", () => {
  const packageJson = readPackageJson();
  const keybindings = packageJson.contributes?.keybindings ?? [];

  assert.ok(
    keybindings.some((keybinding) => {
      return (
        keybinding.command ===
          "path-to-terminal.sendLastActiveFilePathToTerminal" &&
        keybinding.key === "ctrl+shift+l" &&
        keybinding.mac === "cmd+shift+l" &&
        keybinding.when === undefined
      );
    }),
  );
});
