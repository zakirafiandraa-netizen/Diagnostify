import { CSSProperties } from 'react';
import '@phosphor-icons/react';

declare module '@phosphor-icons/react' {
  export interface IconProps {
    className?: string;
    style?: CSSProperties;
  }
}
