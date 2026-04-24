export interface PositionLike {
  line: number;
  character: number;
}

export interface SelectionLike {
  isEmpty: boolean;
  start: PositionLike;
  end: PositionLike;
}

export interface ActiveEditorState {
  documentPath: string;
  selection: SelectionLike;
}

export interface TerminalLike {
  sendText(text: string, addNewLine?: boolean): void;
  show(preserveFocus?: boolean): void;
}

export interface FilePathCommandOptions {
  pathSource: "clipboard";
}

export interface ExtensionHost {
  createTerminal(): TerminalLike;
  executeCommand(command: string): Thenable<unknown>;
  getActiveEditorState(): ActiveEditorState | undefined;
  getLastActiveEditorState(): ActiveEditorState | undefined;
  getActiveTerminal(): TerminalLike | undefined;
  readClipboardText(): Thenable<string>;
  showWarningMessage(message: string): void;
  writeClipboardText(text: string): Thenable<void>;
}
