const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add resolver alias for web platform
config.resolver.alias = {
  ...config.resolver.alias,
};

// Platform-specific resolver for react-native-maps
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add platform-specific module resolution
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Mock react-native-maps for web platform
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      filePath: require.resolve('./__mocks__/react-native-maps.js'),
      type: 'sourceFile',
    };
  }
  
  // Use default resolver for other cases
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;