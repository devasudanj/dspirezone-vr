const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prevent Metro from watching node_modules for file changes.
// This avoids the EMFILE (too many open files) error on macOS with many packages.
config.watchFolders = [__dirname];
config.resolver.blockList = [/node_modules\/.*\/node_modules\/.*/];

module.exports = config;
