const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Enable WASM support (required for expo-sqlite on web)
config.resolver.assetExts.push("wasm");

module.exports = config;
