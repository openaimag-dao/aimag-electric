import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { telegramChannel } from "./channels";
import { logger } from "@/lib/logger";
import { siteConfig } from "@/config/site";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("Telegram notifications", () => {
  it("does not contact Telegram when it is not configured", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_CHAT_ID", "");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await telegramChannel.send({ title: "Test" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends an absolute link to the exact quote", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token");
    vi.stubEnv("TELEGRAM_CHAT_ID", "test-chat");
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetch);
    await telegramChannel.send({ title: "Test", link: "/admin/quotes?quote=test-quote" });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.text).toContain(`${siteConfig.url}/admin/quotes?quote=test-quote`);
    expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("finishes when the request times out without exposing the token in logs", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "secret-test-token");
    vi.stubEnv("TELEGRAM_CHAT_ID", "test-chat");
    const controller = new AbortController();
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url, options) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener("abort", () => reject(new Error("secret-test-token")));
          })
      )
    );
    const pending = telegramChannel.send({ title: "Test" });
    controller.abort();
    await expect(pending).resolves.toBeUndefined();
    expect(timeout).toHaveBeenCalledWith(5000);
    expect(logger.error).toHaveBeenCalledWith("notify.telegram_unavailable", {
      reason: "timeout_or_network",
    });
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain("secret-test-token");
  });
});
