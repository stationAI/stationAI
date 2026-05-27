const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Intercept Windows-invalid "node:" namespaces to prevent directory creation crashes (e.g. node:sea, node:fs)
  if (moduleName.startsWith('node:')) {
    return {
      type: 'empty',
    };
  }

  // Fallback to the default Metro resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
