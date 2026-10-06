/** @type {import('next').NextConfig} */
module.exports = {
  // CDS downloads run in the background. Keep the proxy timeout long enough
  // for a status poll, and never treat a slow upstream as an immediate failure.
  experimental: {
    proxyTimeout: 120_000,
  },
  async rewrites() {
    // Proxy /api/** to the FastAPI backend during local development
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/:path*`,
      },
    ];
  },
};
