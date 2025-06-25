// Mock implementation of react-native-maps for web compatibility
import React from 'react';
import { View } from 'react-native';

// Mock MapView component
export const MapView = React.forwardRef((props, ref) => {
  return React.createElement(View, { ...props, ref });
});

// Mock Marker component
export const Marker = React.forwardRef((props, ref) => {
  return React.createElement(View, { ...props, ref });
});

// Mock Callout component
export const Callout = React.forwardRef((props, ref) => {
  return React.createElement(View, { ...props, ref });
});

// Mock Circle component
export const Circle = React.forwardRef((props, ref) => {
  return React.createElement(View, { ...props, ref });
});

// Mock Polygon component
export const Polygon = React.forwardRef((props, ref) => {
  return React.createElement(View, { ...props, ref });
});

// Mock Polyline component
export const Polyline = React.forwardRef((props, ref) => {
  return React.createElement(View, { ...props, ref });
});

// Mock constants
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

// Default export
export default MapView;