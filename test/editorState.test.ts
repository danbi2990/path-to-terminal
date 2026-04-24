import test from "node:test";
import assert from "node:assert/strict";
import {
  EditorLike,
  resolveLastActiveEditorState,
  toActiveEditorState,
} from "../src/editorState";
import { ActiveEditorState } from "../src/types";

function createEditor(options?: {
  documentPath?: string;
  endCharacter?: number;
  endLine?: number;
  isEmpty?: boolean;
  scheme?: string;
  startCharacter?: number;
  startLine?: number;
}): EditorLike {
  return {
    document: {
      uri: {
        fsPath: options?.documentPath ?? "/Users/example/project/src/extension.ts",
        scheme: options?.scheme ?? "file",
      },
    },
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

function createEditorState(documentPath: string): ActiveEditorState {
  return {
    documentPath,
    selection: {
      isEmpty: true,
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
    },
  };
}

test("toActiveEditorState returns file-backed editor state", () => {
  assert.deepEqual(toActiveEditorState(createEditor()), {
    documentPath: "/Users/example/project/src/extension.ts",
    selection: {
      isEmpty: true,
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
    },
  });
});

test("toActiveEditorState ignores non-file editors", () => {
  assert.equal(
    toActiveEditorState(
      createEditor({
        documentPath: "settings.json",
        scheme: "vscode-userdata",
      }),
    ),
    undefined,
  );
});

test("resolveLastActiveEditorState prefers the current active file editor", () => {
  assert.deepEqual(
    resolveLastActiveEditorState(
      createEditor({
        documentPath: "/Users/example/project/src/current.ts",
      }),
      createEditorState("/Users/example/project/src/last.ts"),
    ),
    createEditorState("/Users/example/project/src/current.ts"),
  );
});

test("resolveLastActiveEditorState falls back to the remembered file editor", () => {
  assert.deepEqual(
    resolveLastActiveEditorState(
      undefined,
      createEditorState("/Users/example/project/src/last.ts"),
    ),
    createEditorState("/Users/example/project/src/last.ts"),
  );
});

test("resolveLastActiveEditorState keeps the remembered editor for non-file tabs", () => {
  assert.deepEqual(
    resolveLastActiveEditorState(
      createEditor({
        documentPath: "settings.json",
        scheme: "vscode-userdata",
      }),
      createEditorState("/Users/example/project/src/last.ts"),
    ),
    createEditorState("/Users/example/project/src/last.ts"),
  );
});
