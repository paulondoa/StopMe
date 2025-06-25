const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add custom resolver to handle react-native-maps on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect react-native-maps to mock when on web platform
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      filePath: require.resolve('./__mocks__/react-native-maps.js'),
      type: 'sourceFile',
    };
  }
  
  // Use default resolver for all other cases
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;