import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: the portal is opened from the LAN address as well as localhost.
  // Without this, Next blocks the dev assets and the session request fails in the browser.
  allowedDevOrigins: ["10.0.0.182"],
};

export default nextConfig;
