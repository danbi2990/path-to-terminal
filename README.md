# Path to Terminal

Path to Terminal is a VS Code extension that sends the active file path or
selected line range to the integrated terminal using absolute paths.

Built for file-based conversations with AI agents inside VS Code: when you
want to ask about a file, point an agent at a specific range, or give an
instruction tied to code, Path to Terminal lets you send that file reference
to the terminal immediately and continue the command you are building.

## Why I Built It

I made this extension to make file references faster to use when working with
AI agents. In that workflow, I often want to point to a file, a line, or a line
range while asking a question or giving an instruction. Instead of retyping or
manually copying those references, I want the exact path ready in the terminal
so I can keep moving.

## Features

- Send the current file path to the terminal in the format `/absolute/path/to/file.ts`
- Send the current selection to the terminal in the format `/absolute/path/to/file.ts:10-20`
- Send the last active file path from anywhere, even when focus has moved away from the editor
- Send a selected file or folder path from the Explorer or Open Editors context menu
- Reuse the active terminal when one exists, or create a new one when needed
- Leave the text unexecuted so you can append it to an existing command

## Commands

- `path-to-terminal.sendAbsoluteSelectionToTerminal`
- `path-to-terminal.sendAbsoluteFilePathToTerminal`
- `path-to-terminal.sendLastActiveFilePathToTerminal`

The file path command works from the active editor and from the sidebar when you right-click a file or folder in Explorer or Open Editors.

## Default Keybindings

- `Cmd+L` / `Ctrl+L`: send the selected line reference, or the active file path when nothing is selected
- `Cmd+L` / `Ctrl+L` also works when a file or folder is focused in Explorer or Open Editors
- `Cmd+Shift+L` / `Ctrl+Shift+L`: send the last active file-backed editor path from anywhere in VS Code

## Examples

- Single line: `/Users/example/project/src/extension.ts:42`
- Multi-line selection: `/Users/example/project/src/extension.ts:10-20`
- File path only: `/Users/example/project/src/extension.ts`

## Development

```bash
npm install
npm test
```
