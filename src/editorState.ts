import { ActiveEditorState, PositionLike, SelectionLike } from "./types";

export interface EditorLike {
  document: {
    uri: {
      fsPath: string;
      scheme: string;
    };
  };
  selection: {
    end: PositionLike;
    isEmpty: boolean;
    start: PositionLike;
  };
}

function toSelectionLike(editor: EditorLike): SelectionLike {
  return {
    isEmpty: editor.selection.isEmpty,
    start: {
      line: editor.selection.start.line,
      character: editor.selection.start.character,
    },
    end: {
      line: editor.selection.end.line,
      character: editor.selection.end.character,
    },
  };
}

export function toActiveEditorState(
  editor?: EditorLike,
): ActiveEditorState | undefined {
  if (!editor || editor.document.uri.scheme !== "file") {
    return undefined;
  }

  return {
    documentPath: editor.document.uri.fsPath,
    selection: toSelectionLike(editor),
  };
}

export function resolveLastActiveEditorState(
  activeEditor: EditorLike | undefined,
  lastActiveEditorState: ActiveEditorState | undefined,
): ActiveEditorState | undefined {
  return toActiveEditorState(activeEditor) ?? lastActiveEditorState;
}
