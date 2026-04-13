import { Hono } from "hono";
import { launchBrowser } from "../utils/browser";
import {
  extractKwikUrl,
  getKwikDownloadUrl,
  resolveKwik,
} from "../controllers/testController";
import { CustomError } from "../middleware/errorHandler";

export const testRoutes = new Hono();

testRoutes.get("/kwik-test", async (c) => {
  const url = c.req.query("url");
  if (!url) {
    throw new CustomError("Url is required", 400);
  }
  const result = await resolveKwik(url);
  return c.json(result);
});

testRoutes.get("/downlod-test", async (c) => {
  const url = c.req.query("url");
  if (!url) {
    throw new CustomError("Url is required", 400);
  }

  const resolvedUrl = await extractKwikUrl(url);
  if (!resolvedUrl) {
    const downloadUrl = await getKwikDownloadUrl(url);
    return c.json({ downloadUrl, type: "direct_download" });
  }

  const downloadUrl = await getKwikDownloadUrl(resolvedUrl);
  return c.json({
    downloadUrl,
    type: "redirected_download",
    originalUrl: url,
    resolvedUrl,
  });
});

testRoutes.get("/test", async (c) => {
  try {
    const playPageUrl =
      "https://animepahe.pw/play/9a16dfb8-8ffc-a0b0-6508-1b291afa04a7/b3a2934c2694eb256d0258ea1fea00dbf620eddd57cbadb97bec7019dc18dcc9";
    const browser = (await launchBrowser()) as {
      newContext: (options: Record<string, unknown>) => Promise<{
        newPage: () => Promise<{
          route: (
            pattern: string,
            handler: (route: {
              request: () => {
                url: () => string;
                headers: () => Record<string, string>;
              };
              fetch: (init?: {
                headers?: Record<string, string>;
              }) => Promise<Response>;
              fulfill: (input: { response: Response }) => Promise<void>;
              continue: () => void;
              abort: () => void;
            }) => void | Promise<void>,
          ) => Promise<void>;
          goto: (
            url: string,
            options: Record<string, unknown>,
          ) => Promise<void>;
          waitForTimeout: (ms: number) => Promise<void>;
          waitForSelector: (
            selector: string,
            options: Record<string, unknown>,
          ) => Promise<void>;
          click: (selector: string) => Promise<void>;
        }>;
      }>;
      close: () => Promise<void>;
    };
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
      javaScriptEnabled: true,
      extraHTTPHeaders: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    const page = await context.newPage();
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (
        /ads|doubleclick|popunder|popads|brunetsmolted|duelistdoesnt|kryptonnutlet|whitebit|garsilgilpey|analytics|googletagmanager|facebook|twitter/.test(
          url,
        )
      ) {
        return route.abort();
      }
      route.continue();
    });

    await page.goto(playPageUrl, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(3000);

    let kwikResponse: string | null = null;
    let kwikUrl: string | null = null;

    await page.route("**/kwik.si/e/**", async (route) => {
      kwikUrl = route.request().url();
      try {
        const response = await route.fetch({
          headers: {
            ...route.request().headers(),
            Referer: playPageUrl,
            Origin: "https://animepahe.pw",
          },
        });
        const responseText = await response.text();
        kwikResponse = responseText;
        await route.fulfill({ response });
      } catch {
        route.continue();
      }
    });

    await page.waitForSelector(".click-to-load .reload", { timeout: 45000 });
    await page.click(".click-to-load .reload");

    const maxWait = 60000;
    const interval = 2000;
    let elapsed = 0;
    while (!kwikResponse && elapsed < maxWait) {
      await page.waitForTimeout(interval);
      elapsed += interval;
    }
    await browser.close();

    if (!kwikResponse) {
      throw new Error(
        `kwik response not captured within time limit. URL detected: ${kwikUrl ?? "none"}`,
      );
    }

    if (
      kwikResponse.includes("Just a moment") ||
      kwikResponse.includes("Checking your browser")
    ) {
      return c.json(
        {
          message: "Cloudflare challenge detected",
          kwikUrl,
          note: "Try again in a few moments or implement additional bypass techniques",
          preview: kwikResponse.slice(0, 500),
        },
        202,
      );
    }

    const videoUrlMatches =
      kwikResponse.match(/source.*?src=["']([^"']+)["']/i) ||
      kwikResponse.match(/file:\s*["']([^"']+)["']/i) ||
      kwikResponse.match(/src=["']([^"']+\.mp4[^"']*)["']/i) ||
      kwikResponse.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/i);
    const videoUrl = videoUrlMatches
      ? (videoUrlMatches[1] ?? videoUrlMatches[0])
      : null;

    return c.json({
      message: "Success",
      kwikUrl,
      videoUrl,
      extractedData: videoUrl ? { videoUrl } : {},
      preview: kwikResponse.slice(0, 500),
      contentLength: kwikResponse.length,
      captureMethod: "Enhanced route interception with Cloudflare bypass",
      hasVideoUrl: !!videoUrl,
    });
  } catch (error) {
    return c.json(
      {
        error: (error as Error).message,
        details: "Check server logs for more information",
      },
      500,
    );
  }
});
