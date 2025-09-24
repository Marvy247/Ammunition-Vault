import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    config.resolve.alias['@contract'] = require('path').join(__dirname, '../contract');
    return config;
  },
};

export default nextConfig;
