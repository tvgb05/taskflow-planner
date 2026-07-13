import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));

function getApiProxyTarget(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const target = new URL(value);

    if (!target.hostname || !["http:", "https:"].includes(target.protocol)) {
      throw new Error("Unsupported proxy target");
    }

    return target.origin;
  } catch {
    console.warn(
      "API_PROXY_TARGET is not a valid HTTP(S) origin; the /backend proxy is disabled.",
    );
    return undefined;
  }
}

const apiProxyTarget = getApiProxyTarget(process.env.API_PROXY_TARGET);

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },
  async rewrites() {
    if (!apiProxyTarget) {
      return [];
    }

    return [
      {
        source: "/backend/:path*",
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
