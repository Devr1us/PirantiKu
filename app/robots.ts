import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pirantiku.id";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/alat", "/alat/*", "/kategori/*"],
        disallow: [
          "/admin",
          "/admin/*",
          "/checkout",
          "/checkout/*",
          "/booking-saya",
          "/booking-saya/*",
          "/pembayaran",
          "/pembayaran/*",
          "/invoice",
          "/invoice/*",
          "/profil",
          "/profil/*",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

