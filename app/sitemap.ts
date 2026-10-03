import { MetadataRoute } from "next";
import { posts } from "#site/content";
import { siteConfig } from "@/config/site";

function getBaseUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? siteConfig.url;
}

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = getBaseUrl();

    const staticRoutes: MetadataRoute.Sitemap = [
        ...["/games", "/games/escape-the-forest", "/games/sovereign-clash", "/games/dead-shift", "/games/rooftop-rush"].map((route) => ({
            url: `${baseUrl}${route}`, changeFrequency: "monthly" as const, priority: 0.8,
        })),
        {url: `${baseUrl}/education`, changeFrequency: "monthly", priority: 0.9},
        {url: `${baseUrl}/education/chemistry`, changeFrequency: "monthly", priority: 0.8},
        {url: `${baseUrl}/education/physics`, changeFrequency: "monthly", priority: 0.8},
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1,
        },
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
    ];

    const postRoutes: MetadataRoute.Sitemap = posts
        .filter((post) => post.published)
        .map((post) => ({
            url: `${baseUrl}/${post.slug}`,
            lastModified: new Date(post.date),
            changeFrequency: "yearly" as const,
            priority: 0.6,
        }));

    return [...staticRoutes, ...postRoutes];
}
