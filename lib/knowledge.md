# Browser Configuration

## Custom Browser Executable

Set custom Chrome/Chromium executable path in two ways:

1. Environment variable:

```bash
BROWSER_PATH=/path/to/chrome
```

2. Code configuration:

```typescript
const stagehand = new Stagehand({
  browserLaunchOptions: {
    executablePath: "/path/to/chrome",
  },
});
```

This is useful for:

- Using a specific Chrome/Chromium version
- Testing with custom browser builds
- Environments where default browser installation is not accessible

The executablePath is passed directly to Playwright's launchPersistentContext. If not specified, Playwright uses its bundled browser.

## Default Chrome Installation Paths

Default Chrome paths by operating system:

- macOS: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- Windows:
  - `%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe`
  - `%PROGRAMFILES%\Google\Chrome\Application\chrome.exe`
  - `%PROGRAMFILES(X86)%\Google\Chrome\Application\chrome.exe`
- Linux:
  - `/usr/bin/google-chrome`
  - `/usr/bin/google-chrome-stable`
