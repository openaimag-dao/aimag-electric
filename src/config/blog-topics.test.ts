import { describe, expect, it } from "vitest";
import { articles } from "@/config/articles";
import { blogTopics, findBlogTopic } from "@/config/blog-topics";

describe("blog topic navigation", () => {
  it("keeps every published article reachable exactly once and rejects stale links", () => {
    const published = articles.map((article) => article.slug).sort();
    const grouped = blogTopics.flatMap((topic) => topic.slugs).sort();
    expect(grouped).toEqual(published);
    expect(new Set(grouped).size).toBe(grouped.length);
  });
  it("connects buying guides to their topic without assigning unknown articles", () => {
    expect(findBlogTopic("kupit-vvgng-kazakhstan")?.id).toBe("cables");
    expect(findBlogTopic("kupit-ktp-kazakhstan")?.id).toBe("equipment");
    expect(findBlogTopic("unknown-article")).toBeUndefined();
  });
});
