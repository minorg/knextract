import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.KNEXTRACT_NEXT_BASE_PATH,
  output: "standalone",
  webpack: (config) => {
    config.resolve.alias["handlebars"] = path.resolve(
      path.join(".", "node_modules", "handlebars", "dist", "handlebars.js"),
    );
    return config;
  },
};

const withNextIntl = createNextIntlPlugin("./i18n.ts");
export default withNextIntl(nextConfig);
