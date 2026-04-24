import test from "node:test";
import assert from "node:assert/strict";
import { createCommandHandlers } from "../src/commands";
import {
  ActiveEditorState,
  ExtensionHost,
  FilePathCommandOptions,
  TerminalLike,
} from "../src/types";

const CLIPBOARD_PATH_TARGET: FilePathCommandOptions = {
  pathSource: "clipboard",
};

class FakeTerminal implements TerminalLike {
  public readonly sentTexts: Array<{ addNewLine?: boolean; text: string }> = [];
  public showCallCount = 0;

  sendText(text: string, addNewLine?: boolean): void {
    this.sentTexts.push({ text, addNewLine });
  }

  show(): void {
    this.showCallCount += 1;
  }
}

function createEditorState(options?: {
  documentPath?: string;
  endCharacter?: number;
  endLine?: number;
  isEmpty?: boolean;
  startCharacter?: number;
  startLine?: number;
}): ActiveEditorState {
  return {
    documentPath: options?.documentPath ?? "/Users/example/project/src/extension.ts",
    selection: {
      isEmpty: options?.isEmpty ?? true,
      start: {
        line: options?.startLine ?? 0,
        character: options?.startCharacter ?? 0,
      },
      end: {
        line: options?.endLine ?? 0,
        character: options?.endCharacter ?? 0,
      },
    },
  };
}

function assertTerminalSentText(terminal: FakeTerminal, text: string): void {
  assert.deepEqual(terminal.sentTexts, [
    {
      text,
      addNewLine: false,
    },
  ]);
  assert.equal(terminal.showCallCount, 1);
}

function createHost(options?: {
  activeEditorState?: ActiveEditorState;
  activeTerminal?: FakeTerminal;
  clipboardText?: string;
  copiedPath?: string;
  lastActiveEditorState?: ActiveEditorState;
  readClipboardText?: (currentClipboardText: string) => string;
}): {
  clipboardText: string;
  createdTerminal: FakeTerminal | undefined;
  executedCommands: string[];
  host: ExtensionHost;
  warnings: string[];
} {
  const warnings: string[] = [];
  const executedCommands: string[] = [];
  let createdTerminal: FakeTerminal | undefined;
  let clipboardText = options?.clipboardText ?? "";

  return {
    get clipboardText() {
      return clipboardText;
    },
    get createdTerminal() {
      return createdTerminal;
    },
    executedCommands,
    host: {
      createTerminal(): FakeTerminal {
        createdTerminal = new FakeTerminal();
        return createdTerminal;
      },
      async executeCommand(command: string): Promise<void> {
        executedCommands.push(command);

        if (command === "copyFilePath" && options?.copiedPath !== undefined) {
          clipboardText = options.copiedPath;
        }
      },
      getActiveEditorState(): ActiveEditorState | undefined {
        return options?.activeEditorState;
      },
      getLastActiveEditorState(): ActiveEditorState | undefined {
        return options?.activeEditorState ?? options?.lastActiveEditorState;
      },
      getActiveTerminal(): FakeTerminal | undefined {
        return options?.activeTerminal;
      },
      async readClipboardText(): Promise<string> {
        if (options?.readClipboardText) {
          clipboardText = options.readClipboardText(clipboardText);
        }

        return clipboardText;
      },
      showWarningMessage(message: string): void {
        warnings.push(message);
      },
      async writeClipboardText(text: string): Promise<void> {
        clipboardText = text;
      },
    },
    warnings,
  };
}

test("sendFilePathToTerminal reuses the active terminal when available", async () => {
  const activeTerminal = new FakeTerminal();
  const { host, warnings } = createHost({
    activeEditorState: createEditorState(),
    activeTerminal,
  });

  const handlers = createCommandHandlers(host);
  await handlers.sendAbsoluteFilePathToTerminal();

  assert.deepEqual(warnings, []);
  assertTerminalSentText(activeTerminal, "/Users/example/project/src/extension.ts");
});

test("sendFilePathToTerminal creates a terminal when none is active", async () => {
  const fixture = createHost({
    activeEditorState: createEditorState(),
  });

  const handlers = createCommandHandlers(fixture.host);
  await handlers.sendAbsoluteFilePathToTerminal();

  assert.deepEqual(fixture.warnings, []);
  assert.ok(fixture.createdTerminal);
  assertTerminalSentText(
    fixture.createdTerminal,
    "/Users/example/project/src/extension.ts",
  );
});

test("sendFilePathToTerminal uses an explicit target path without an active editor", async () => {
  const activeTerminal = new FakeTerminal();
  const { host, warnings } = createHost({
    activeTerminal,
  });

  const handlers = createCommandHandlers(host);
  await handlers.sendAbsoluteFilePathToTerminal(
    "/Users/example/project/src/from-explorer.ts",
  );

  assert.deepEqual(warnings, []);
  assertTerminalSentText(activeTerminal, "/Users/example/project/src/from-explorer.ts");
});

test("sendFilePathToTerminal reads the selected Explorer path from the clipboard fallback", async () => {
  const activeTerminal = new FakeTerminal();
  const fixture = createHost({
    activeTerminal,
    clipboardText: "original clipboard",
    copiedPath: "/Users/example/project/src/from-explorer-shortcut.ts",
  });

  const handlers = createCommandHandlers(fixture.host);
  await handlers.sendAbsoluteFilePathToTerminal(CLIPBOARD_PATH_TARGET);

  assert.deepEqual(fixture.warnings, []);
  assert.deepEqual(fixture.executedCommands, ["copyFilePath"]);
  assert.equal(fixture.clipboardText, "original clipboard");
  assertTerminalSentText(
    activeTerminal,
    "/Users/example/project/src/from-explorer-shortcut.ts",
  );
});

test("sendFilePathToTerminal warns when the clipboard fallback finds no selected file", async () => {
  const fixture = createHost({
    clipboardText: "original clipboard",
    copiedPath: "",
  });

  const handlers = createCommandHandlers(fixture.host);
  await handlers.sendAbsoluteFilePathToTerminal(CLIPBOARD_PATH_TARGET);

  assert.equal(fixture.createdTerminal, undefined);
  assert.deepEqual(fixture.executedCommands, ["copyFilePath"]);
  assert.equal(fixture.clipboardText, "original clipboard");
  assert.deepEqual(fixture.warnings, ["No active editor or selected file"]);
});

test("sendFilePathToTerminal waits for the clipboard path to appear", async () => {
  const activeTerminal = new FakeTerminal();
  let readCount = 0;
  const fixture = createHost({
    activeTerminal,
    clipboardText: "original clipboard",
    copiedPath: "original clipboard",
    readClipboardText(currentClipboardText): string {
      readCount += 1;
      if (readCount < 4) {
        return currentClipboardText;
      }

      return "/Users/example/project/src/delayed-explorer-shortcut.ts";
    },
  });

  const handlers = createCommandHandlers(fixture.host);
  await handlers.sendAbsoluteFilePathToTerminal(CLIPBOARD_PATH_TARGET);

  assert.deepEqual(fixture.warnings, []);
  assertTerminalSentText(
    activeTerminal,
    "/Users/example/project/src/delayed-explorer-shortcut.ts",
  );
  assert.equal(fixture.clipboardText, "original clipboard");
});

test("sendFilePathToTerminal warns when there is no active editor or selected file", async () => {
  const { host, createdTerminal, warnings } = createHost();

  const handlers = createCommandHandlers(host);
  await handlers.sendAbsoluteFilePathToTerminal();

  assert.equal(createdTerminal, undefined);
  assert.deepEqual(warnings, ["No active editor or selected file"]);
});

test("sendSelectionToTerminal warns when there is no active editor", () => {
  const { host, createdTerminal, warnings } = createHost();

  const handlers = createCommandHandlers(host);
  handlers.sendAbsoluteSelectionToTerminal();

  assert.equal(createdTerminal, undefined);
  assert.deepEqual(warnings, ["No active editor"]);
});

test("sendLastActiveFilePathToTerminal uses the remembered editor path", () => {
  const activeTerminal = new FakeTerminal();
  const { host, warnings } = createHost({
    activeTerminal,
    lastActiveEditorState: createEditorState({
      documentPath: "/Users/example/project/src/last-active.ts",
    }),
  });

  const handlers = createCommandHandlers(host);
  handlers.sendLastActiveFilePathToTerminal();

  assert.deepEqual(warnings, []);
  assertTerminalSentText(activeTerminal, "/Users/example/project/src/last-active.ts");
});

test("sendLastActiveFilePathToTerminal prefers the current active editor path", () => {
  const activeTerminal = new FakeTerminal();
  const { host, warnings } = createHost({
    activeEditorState: createEditorState({
      documentPath: "/Users/example/project/src/current.ts",
    }),
    activeTerminal,
    lastActiveEditorState: createEditorState({
      documentPath: "/Users/example/project/src/last-active.ts",
    }),
  });

  const handlers = createCommandHandlers(host);
  handlers.sendLastActiveFilePathToTerminal();

  assert.deepEqual(warnings, []);
  assertTerminalSentText(activeTerminal, "/Users/example/project/src/current.ts");
});

test("sendLastActiveFilePathToTerminal warns when there is no remembered editor", () => {
  const { host, createdTerminal, warnings } = createHost();

  const handlers = createCommandHandlers(host);
  handlers.sendLastActiveFilePathToTerminal();

  assert.equal(createdTerminal, undefined);
  assert.deepEqual(warnings, ["No recently active file editor"]);
});

test("sendSelectionToTerminal falls back to the file path when the selection is empty", () => {
  const activeTerminal = new FakeTerminal();
  const { host, warnings } = createHost({
    activeEditorState: createEditorState({
      isEmpty: true,
      startLine: 2,
      endLine: 2,
    }),
    activeTerminal,
  });

  const handlers = createCommandHandlers(host);
  handlers.sendAbsoluteSelectionToTerminal();

  assert.deepEqual(warnings, []);
  assertTerminalSentText(activeTerminal, "/Users/example/project/src/extension.ts");
});

test("sendSelectionToTerminal sends an absolute line reference", () => {
  const activeTerminal = new FakeTerminal();
  const { host, warnings } = createHost({
    activeEditorState: createEditorState({
      isEmpty: false,
      startLine: 4,
      startCharacter: 2,
      endLine: 8,
      endCharacter: 4,
    }),
    activeTerminal,
  });

  const handlers = createCommandHandlers(host);
  handlers.sendAbsoluteSelectionToTerminal();

  assert.deepEqual(warnings, []);
  assertTerminalSentText(activeTerminal, "/Users/example/project/src/extension.ts:5-9");
});

test("sendSelectionToTerminal treats a column-zero selection end as the previous line", () => {
  const activeTerminal = new FakeTerminal();
  const { host, warnings } = createHost({
    activeEditorState: createEditorState({
      isEmpty: false,
      startLine: 4,
      startCharacter: 2,
      endLine: 8,
      endCharacter: 0,
    }),
    activeTerminal,
  });

  const handlers = createCommandHandlers(host);
  handlers.sendAbsoluteSelectionToTerminal();

  assert.deepEqual(warnings, []);
  assertTerminalSentText(activeTerminal, "/Users/example/project/src/extension.ts:5-8");
});
