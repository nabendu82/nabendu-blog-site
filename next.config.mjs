import { build } from "velite";

/** @type {import('next').NextConfig} */
const nextConfig = {
    // othor next config here...
};

const isDev = process.env.NODE_ENV === "development";

if (!process.env.VELITE_STARTED) {
    process.env.VELITE_STARTED = "1";
    await build({ watch: isDev, clean: !isDev });
}

export default nextConfig;
