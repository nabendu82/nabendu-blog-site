import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

function getBaseUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? siteConfig.url;
}

export default function robots(): MetadataRoute.Robots {
    const baseUrl = getBaseUrl();

    return {
        rules: {
            userAgent: "*",
            allow: "/",
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
