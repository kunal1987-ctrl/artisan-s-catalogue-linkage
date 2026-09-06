import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
  interface TouchableWithoutFeedbackProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface SafeAreaViewProps {
    className?: string;
  }
  interface StatusBarProps {
    className?: string;
    backgroundColor?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface ModalProps {
    className?: string;
  }
}

declare module '@expo/vector-icons' {
  import React from 'react';
  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
    className?: string;
  }
  export const MaterialIcons: React.FC<IconProps>;
  export const Ionicons: React.FC<IconProps>;
  export const Feather: React.FC<IconProps>;
  export const MaterialCommunityIcons: React.FC<IconProps>;
  export const FontAwesome: React.FC<IconProps>;
  export const FontAwesome5: React.FC<IconProps>;
  export const Entypo: React.FC<IconProps>;
}
