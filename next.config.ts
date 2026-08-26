import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Barrel-heavy packages: without this, importing one icon pulls the whole
    // module graph into the route chunk. @ant-design/icons in particular
    // re-exports thousands of components.
    optimizePackageImports: [
      '@mantine/core',
      'antd',
      '@ant-design/icons',
      'lucide-react',
      'lodash',
      'framer-motion',
    ]
  }
};

// Conditionally apply react-dev-inspector only in development
let config: NextConfig = nextConfig;

if (
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_DEV_INSPECTOR === "true"
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const inspectorPlugin = require("react-dev-inspector/plugins/next");
    const { withInspector } = inspectorPlugin;
    
    if (typeof withInspector === "function") {
      config = withInspector(nextConfig);
      console.log("✓ react-dev-inspector enabled: Press Alt+Click to inspect components");
    } else {
      console.warn("react-dev-inspector: withInspector is not a function");
    }
  } catch (error: any) {
    // Log the actual error for debugging
    console.error("react-dev-inspector failed to load:", error?.message || error);
    console.warn("Continuing without react-dev-inspector...");
  }
}

export default config;                      