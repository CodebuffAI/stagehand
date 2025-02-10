/**
 * This file is meant to be used as a scratchpad for developing new evals.
 * To create a Stagehand project with best practices and configuration, run:
 *
 * npx create-browser-app@latest my-browser-app
 */

import { Stagehand } from "@/dist";
import StagehandConfig from "@/stagehand.config";
import path from "path";
import fs from "fs";
import { z } from "zod";

function getDefaultChromePath(): string | undefined {
  const platform = process.platform;

  switch (platform) {
    case "darwin": // macOS
      return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    case "win32": {
      // Windows
      const windowsPaths = [
        path.join(
          process.env.LOCALAPPDATA!,
          "Google/Chrome/Application/chrome.exe",
        ),
        path.join(
          process.env.PROGRAMFILES!,
          "Google/Chrome/Application/chrome.exe",
        ),
        path.join(
          process.env["PROGRAMFILES(X86)"]!,
          "Google/Chrome/Application/chrome.exe",
        ),
      ];
      return windowsPaths.find((p) => fs.existsSync(p));
    }
    case "linux": {
      // Linux
      const linuxPaths = [
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
      ];
      return linuxPaths.find((p) => fs.existsSync(p));
    }
    default:
      return undefined;
  }
}

async function example() {
  const chromePath = getDefaultChromePath();
  if (!chromePath) {
    console.warn("Could not find Chrome installation. Using default browser.");
  }

  // UPDATED: The Codebuff client will be automatically used because we specified backendUrl in modelClientOptions
  const stagehand = new Stagehand({
    ...StagehandConfig,
    browserLaunchOptions: {
      executablePath: chromePath,
    },
  });

  try {
    await stagehand.init();
  } catch (error) {
    console.error("Uh-oh, couldn't initialize browser:", error.message);
    process.exit(1);
  }

  await stagehand.page.goto("https://codebuff.com");
  await stagehand.page.act({
    action: `click the docs link`,
  });
  await stagehand.page.act({
    action: "click the advanced section",
  });
  const codeSnippets = await stagehand.page.extract({
    instruction:
      "Extract the code snippets along with their section title from the advanced section",
    schema: z.object({
      codeSnippets: z.array(
        z.object({
          title: z.string(),
          language: z.string(),
          code: z.string(),
        }),
      ),
    }),
  });
  console.log(JSON.stringify(codeSnippets, null, 2));
}

(async () => {
  await example();
})();
