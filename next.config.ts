import type { NextConfig } from "next";

const nextDistDir = process.env.NEXT_DIST_DIR?.trim();

const nextConfig: NextConfig = {
  ...(nextDistDir ? { distDir: nextDistDir } : {}),
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '9000',
      },
      {
        protocol: 'http',
        hostname: 'minio',
        port: '9000',
      },
      {
        protocol: 'http',
        hostname: 'host.docker.internal',
        port: '9000',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'storage-prg1.zerops.io',
      },
      {
        protocol: 'https',
        hostname: 'fastly.picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      }
    ],
  },
};

export default nextConfig;
