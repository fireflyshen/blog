declare module 'twikoo' {
    interface InitOptions {
      envId: string;
      el: string;
      region?: string;
      path?: string;
      lang?: string;
    }
  
    function init(options: InitOptions): void;
  
    export default {
      init,
    };
  }
  