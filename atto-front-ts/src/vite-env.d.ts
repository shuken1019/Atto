// src/vite-env.d.ts
// Minimal definitions for ImportMeta if vite types are not installed
declare interface ImportMetaEnv {
  readonly [key: string]: string | undefined;
}
declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 이미지 파일들을 모듈로 인식하도록 선언
declare module '*.jpg';
declare module '*.png';
declare module '*.jpeg';
declare module '*.svg';