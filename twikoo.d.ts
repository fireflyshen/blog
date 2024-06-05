// twikoo.d.ts
declare module 'twikoo' {
    interface TwikooConfig {
      envId: string;
      el: string;
      lang?: string;
      perPage?: number;
      // Add other optional configuration options as needed
    }
  
    export function init(config: TwikooConfig): void;
  }
  