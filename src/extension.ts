import * as vscode from "vscode";
import { COMMANDS, createCommandHandlers } from "./commands";
import {
  resolveLastActiveEditorState,
  toActiveEditorState,
} from "./editorState";
import {
  ActiveEditorState,
  ExtensionHost,
  FilePathCommandOptions,
  TerminalLike,
} from "./types";

let lastActiveEditorState = toActiveEditorState(vscode.window.activeTextEditor);

function getActiveEditorState(): ActiveEditorState | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return undefined;
  }

  return toActiveEditorState(editor);
}

function createHost(): ExtensionHost {
  return {
    createTerminal(): TerminalLike {
      return vscode.window.createTerminal("Selection Reference");
    },
    executeCommand(command: string): Thenable<unknown> {
      return vscode.commands.executeCommand(command);
    },
    getActiveEditorState,
    getLastActiveEditorState(): ActiveEditorState | undefined {
      return resolveLastActiveEditorState(
        vscode.window.activeTextEditor,
        lastActiveEditorState,
      );
    },
    getActiveTerminal(): TerminalLike | undefined {
      return vscode.window.activeTerminal;
    },
    readClipboardText(): Thenable<string> {
      return vscode.env.clipboard.readText();
    },
    showWarningMessage(message: string): void {
      void vscode.window.showWarningMessage(message);
    },
    writeClipboardText(text: string): Thenable<void> {
      return vscode.env.clipboard.writeText(text);
    },
  };
}

function getResourcePath(resource?: unknown): string | undefined {
  if (!(resource instanceof vscode.Uri) || resource.scheme !== "file") {
    return undefined;
  }

  return resource.fsPath;
}

function isFilePathCommandOptions(value: unknown): value is FilePathCommandOptions {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as FilePathCommandOptions).pathSource === "clipboard"
  );
}

function resolveFilePathTarget(
  value?: unknown,
): string | FilePathCommandOptions | undefined {
  return getResourcePath(value) ?? (isFilePathCommandOptions(value) ? value : undefined);
}

export function activate(context: vscode.ExtensionContext): void {
  const host = createHost();
  const handlers = createCommandHandlers(host);

  const activeEditorDisposable = vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      const editorState = toActiveEditorState(editor);
      if (editorState) {
        lastActiveEditorState = editorState;
      }
    },
  );

  const sendSelectionDisposable = vscode.commands.registerCommand(
    COMMANDS.sendAbsoluteSelectionToTerminal,
    handlers.sendAbsoluteSelectionToTerminal,
  );
  const sendFilePathDisposable = vscode.commands.registerCommand(
    COMMANDS.sendAbsoluteFilePathToTerminal,
    (resourceOrOptions?: vscode.Uri | FilePathCommandOptions) => {
      return handlers.sendAbsoluteFilePathToTerminal(
        resolveFilePathTarget(resourceOrOptions),
      );
    },
  );
  const sendLastActiveFilePathDisposable = vscode.commands.registerCommand(
    COMMANDS.sendLastActiveFilePathToTerminal,
    handlers.sendLastActiveFilePathToTerminal,
  );

  context.subscriptions.push(
    activeEditorDisposable,
    sendSelectionDisposable,
    sendFilePathDisposable,
    sendLastActiveFilePathDisposable,
  );
}

export function deactivate(): void {}
