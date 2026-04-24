import { SelectionLike } from "./types";

export interface InclusiveLineRange {
  endLine: number;
  startLine: number;
}

export function formatAbsolutePathReference(documentPath: string): string {
  return documentPath;
}

export function getInclusiveLineRange(
  selection: SelectionLike,
): InclusiveLineRange | undefined {
  if (selection.isEmpty) {
    return undefined;
  }

  let endLine = selection.end.line;
  if (selection.end.character === 0 && selection.end.line > selection.start.line) {
    endLine -= 1;
  }

  return {
    startLine: selection.start.line + 1,
    endLine: endLine + 1,
  };
}

export function formatAbsoluteSelectionReference(
  documentPath: string,
  selection: SelectionLike,
): string | undefined {
  const lineRange = getInclusiveLineRange(selection);
  if (!lineRange) {
    return undefined;
  }

  const pathReference = formatAbsolutePathReference(documentPath);
  if (lineRange.startLine === lineRange.endLine) {
    return `${pathReference}:${lineRange.startLine}`;
  }

  return `${pathReference}:${lineRange.startLine}-${lineRange.endLine}`;
}
