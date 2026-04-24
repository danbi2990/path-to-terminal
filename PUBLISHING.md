# Publishing

## Current status

- GitHub repository target: `https://github.com/danbi2990/path-to-terminal`
- Extension package name: `path-to-terminal`
- Current publisher in `package.json`: `danbi2990`

## Local publish flow

```bash
npm test
npm run package
npx @vscode/vsce login danbi2990
npm run publish:marketplace
```

## Notes

- `vsce publish` uses the publisher from `package.json`
- If you prefer PAT-based publishing, use the `VSCE_PAT` environment variable
- Before the first Marketplace release, it may be worth bumping from `0.0.2`
  to `0.1.0`
