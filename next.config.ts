import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: { styledComponents: true },
  outputFileTracingRoot: require("path").join(__dirname, "../../"),
};

export default nextConfig;
