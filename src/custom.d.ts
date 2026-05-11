declare module '*.css';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';

declare const process: {
  env: {
    readonly REACT_APP_API_URL?: string;
  };
};
