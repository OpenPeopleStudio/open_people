import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteOrigin();
  const lastModified = new Date();

  const routes: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/brief", priority: 0.8, changeFrequency: "weekly" },
    { path: "/tracker", priority: 0.8, changeFrequency: "weekly" },
    { path: "/industries", priority: 0.8, changeFrequency: "weekly" },
    { path: "/costs", priority: 0.8, changeFrequency: "weekly" },
    { path: "/engage", priority: 0.8, changeFrequency: "weekly" },
    { path: "/letter", priority: 0.8, changeFrequency: "monthly" },
    { path: "/build", priority: 0.9, changeFrequency: "weekly" },
    { path: "/capital", priority: 0.9, changeFrequency: "weekly" },
    { path: "/consent", priority: 0.9, changeFrequency: "weekly" },
    { path: "/power", priority: 0.9, changeFrequency: "weekly" },
    { path: "/ask", priority: 0.7, changeFrequency: "weekly" },
    { path: "/compute", priority: 0.4, changeFrequency: "weekly" },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "monthly" },
    { path: "/terms", priority: 0.3, changeFrequency: "monthly" },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
