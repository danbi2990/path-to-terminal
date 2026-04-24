import {
  formatAbsolutePathReference,
  formatAbsoluteSelectionReference,
} from "./formatters";
import path from "node:path";
import { ExtensionHost, FilePathCommandOptions, TerminalLike } from "./types";

export const COMMANDS = {
  sendAbsoluteFilePathToTerminal:
    "path-to-terminal.sendAbsoluteFilePathToTerminal",
  sendLastActiveFilePathToTerminal:
    "path-to-terminal.sendLastActiveFilePathToTerminal",
  sendAbsoluteSelectionToTerminal:
    "path-to-terminal.sendAbsoluteSelectionToTerminal",
} as const;

const WARNINGS = {
  noEditor: "No active editor",
  noRecentFile: "No recently active file editor",
  noFile: "No active editor or selected file",
} as const;

const CLIPBOARD_POLL_ATTEMPTS = 10;
const CLIPBOARD_POLL_DELAY_MS = 25;

function getOrCreateTerminal(host: ExtensionHost): TerminalLike {
  return host.getActiveTerminal() ?? host.createTerminal();
}

function sendTextToTerminal(host: ExtensionHost, text: string): void {
  const terminal = getOrCreateTerminal(host);
  terminal.sendText(text, false);
  terminal.show();
}

function isClipboardPathOptions(
  target: string | FilePathCommandOptions | undefined,
): target is FilePathCommandOptions {
  return typeof target === "object" && target?.pathSource === "clipboard";
}

function isReadyClipboardPath(
  previousClipboardText: string,
  copiedPath: string,
): boolean {
  return copiedPath !== previousClipboardText || path.isAbsolute(copiedPath);
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function getClipboardPath(host: ExtensionHost): Promise<string | undefined> {
  const previousClipboardText = await host.readClipboardText();

  try {
    await host.executeCommand("copyFilePath");

    for (let attempt = 0; attempt < CLIPBOARD_POLL_ATTEMPTS; attempt += 1) {
      const copiedPath = await host.readClipboardText();
      if (copiedPath && isReadyClipboardPath(previousClipboardText, copiedPath)) {
        return copiedPath;
      }

      await sleep(CLIPBOARD_POLL_DELAY_MS);
    }

    return undefined;
  } finally {
    await host.writeClipboardText(previousClipboardText);
  }
}

async function resolveDocumentPath(
  host: ExtensionHost,
  target?: string | FilePathCommandOptions,
): Promise<string | undefined> {
  if (typeof target === "string") {
    return target;
  }

  if (isClipboardPathOptions(target)) {
    return getClipboardPath(host);
  }

  return host.getActiveEditorState()?.documentPath;
}

export function createCommandHandlers(host: ExtensionHost): {
  sendAbsoluteFilePathToTerminal(
    target?: string | FilePathCommandOptions,
  ): Promise<void>;
  sendLastActiveFilePathToTerminal(): void;
  sendAbsoluteSelectionToTerminal(): void;
} {
  return {
    sendAbsoluteSelectionToTerminal(): void {
      const editor = host.getActiveEditorState();
      if (!editor) {
        host.showWarningMessage(WARNINGS.noEditor);
        return;
      }

      const selectionReference = formatAbsoluteSelectionReference(
        editor.documentPath,
        editor.selection,
      );

      sendTextToTerminal(
        host,
        selectionReference ?? formatAbsolutePathReference(editor.documentPath),
      );
    },

    async sendAbsoluteFilePathToTerminal(
      target?: string | FilePathCommandOptions,
    ): Promise<void> {
      const documentPath = await resolveDocumentPath(host, target);

      if (!documentPath) {
        host.showWarningMessage(WARNINGS.noFile);
        return;
      }

      sendTextToTerminal(host, formatAbsolutePathReference(documentPath));
    },

    sendLastActiveFilePathToTerminal(): void {
      const documentPath = host.getLastActiveEditorState()?.documentPath;

      if (!documentPath) {
        host.showWarningMessage(WARNINGS.noRecentFile);
        return;
      }

      sendTextToTerminal(host, formatAbsolutePathReference(documentPath));
    },
  };
}
