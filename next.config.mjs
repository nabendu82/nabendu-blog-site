import { build } from "velite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Transpile Three.js ecosystem packages so Next.js handles their ESM modules correctly.
    // Without this, production builds can fail to load 3D scenes.
    transpilePackages: [
        "three",
        "@react-three/fiber",
        "@react-three/drei",
        "@react-three/postprocessing",
        "postprocessing",
    ],
    // Ensure Three.js and R3F resolve to the same physical module instance.
    // Multiple instances cause "Cannot read properties of undefined (reading '$')" at runtime.
    webpack(config) {
        config.resolve.alias = {
            ...config.resolve.alias,
            three: path.resolve(__dirname, "node_modules/three"),
            "@react-three/fiber": path.resolve(__dirname, "node_modules/@react-three/fiber"),
            "@react-three/drei": path.resolve(__dirname, "node_modules/@react-three/drei"),
            "@react-three/postprocessing": path.resolve(__dirname, "node_modules/@react-three/postprocessing"),
            postprocessing: path.resolve(__dirname, "node_modules/postprocessing"),
        };
        return config;
    },
};

const isDev = process.env.NODE_ENV === "development";

if (!process.env.VELITE_STARTED) {
    process.env.VELITE_STARTED = "1";
    await build({ watch: isDev, clean: !isDev });
}

export default nextConfig;
