/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Cloudflare Pages
};

module.exports = nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
