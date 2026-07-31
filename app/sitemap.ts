import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://openpeople.ai";
  const lastModified = new Date();

  const routes = [
    "/",
    "/about",
    "/pricing",
    "/integrations",
    "/security",
    "/contact",
    "/careers",
    "/documentation",
    "/api-reference",
    "/support",
    "/blog",
    "/changelog",
    "/privacy",
    "/terms",
    "/login",
    "/signup",
    "/brief",
  ];

  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency:
      path === "/" ? "weekly" : path === "/brief" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/brief" ? 0.9 : 0.7,
  }));
}

