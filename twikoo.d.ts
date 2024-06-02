declare global {
    interface Window {
      twikoo: {
        init: (options: { 
          envId: string; 
          el: string; 
          region?: string; 
          path?: string; 
          lang?: string;
        }) => void;
      };
    }
  }
  
  declare module 'twikoo' {
    export function init(options: { 
      envId: string; 
      el: string; 
      region?: string; 
      path?: string; 
      lang?: string;
    }): void;
  }
  