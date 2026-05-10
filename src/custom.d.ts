declare module '*.css';

declare const process: {
  env: {
    readonly REACT_APP_API_URL?: string;
  };
};
