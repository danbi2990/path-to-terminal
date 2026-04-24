import test from "node:test";
import assert from "node:assert/strict";
import {
  formatAbsolutePathReference,
  formatAbsoluteSelectionReference,
  getInclusiveLineRange,
} from "../src/formatters";
import { SelectionLike } from "../src/types";

function createSelection(
  startLine: number,
  startCharacter: number,
  endLine: number,
  endCharacter: number,
): SelectionLike {
  return {
    isEmpty: startLine === endLine && startCharacter === endCharacter,
    start: {
      line: startLine,
      character: startCharacter,
    },
    end: {
      line: endLine,
      character: endCharacter,
    },
  };
}

test("formatAbsolutePathReference returns the absolute path as-is", () => {
  assert.equal(
    formatAbsolutePathReference("/Users/example/project/src/extension.ts"),
    "/Users/example/project/src/extension.ts",
  );
});

test("formatAbsolutePathReference preserves spaces in the path", () => {
  assert.equal(
    formatAbsolutePathReference("/Users/example/My Project/src/file.ts"),
    "/Users/example/My Project/src/file.ts",
  );
});

test("getInclusiveLineRange returns undefined for an empty selection", () => {
  assert.equal(getInclusiveLineRange(createSelection(4, 2, 4, 2)), undefined);
});

test("getInclusiveLineRange returns 1-based inclusive lines for normal selections", () => {
  assert.deepEqual(getInclusiveLineRange(createSelection(2, 3, 6, 8)), {
    startLine: 3,
    endLine: 7,
  });
});

test("getInclusiveLineRange treats a column-zero end as the previous line", () => {
  assert.deepEqual(getInclusiveLineRange(createSelection(9, 0, 12, 0)), {
    startLine: 10,
    endLine: 12,
  });
});

test("formatAbsoluteSelectionReference formats a single-line selection", () => {
  assert.equal(
    formatAbsoluteSelectionReference(
      "/Users/example/project/src/extension.ts",
      createSelection(4, 1, 4, 9),
    ),
    "/Users/example/project/src/extension.ts:5",
  );
});

test("formatAbsoluteSelectionReference formats a multi-line selection", () => {
  assert.equal(
    formatAbsoluteSelectionReference(
      "/Users/example/project/src/extension.ts",
      createSelection(4, 1, 8, 9),
    ),
    "/Users/example/project/src/extension.ts:5-9",
  );
});

test("formatAbsoluteSelectionReference trims a trailing line when the selection ends at column zero", () => {
  assert.equal(
    formatAbsoluteSelectionReference(
      "/Users/example/project/src/extension.ts",
      createSelection(4, 1, 8, 0),
    ),
    "/Users/example/project/src/extension.ts:5-8",
  );
});

test("formatAbsoluteSelectionReference returns undefined for an empty selection", () => {
  assert.equal(
    formatAbsoluteSelectionReference(
      "/Users/example/project/src/extension.ts",
      createSelection(1, 0, 1, 0),
    ),
    undefined,
  );
});
