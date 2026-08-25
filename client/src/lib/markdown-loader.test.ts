import { describe, expect, it } from "vitest";
import { resolvePublishedAt } from "./markdown-loader";

describe("resolvePublishedAt", () => {
  it("uses a valid Markdown frontmatter date", () => {
    expect(resolvePublishedAt("2026-04-13")).toBe("2026-04-13T00:00:00+08:00");
  });

  it("uses the stable config timestamp when frontmatter is absent", () => {
    expect(resolvePublishedAt(undefined, "2026-04-13T05:46:41.000Z")).toBe(
      "2026-04-13T05:46:41.000Z",
    );
  });

  it("never falls back to the current time", () => {
    expect(resolvePublishedAt()).toBe("1970-01-01T00:00:00+08:00");
  });
});
