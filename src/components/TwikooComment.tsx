import React, { useEffect } from "react";
import twikoo from "twikoo";

const TwikooComment: React.FC = () => {
  useEffect(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      twikoo.init({
        envId: "https://twikoo-cloudflare.fireflyshen.workers.dev", // 替换为你的Cloudflare Worker地址
        el: "#tcomment", // 容器元素选择器
      });
    }
  }, []);

  return <div id="tcomment"></div>;
};

export default TwikooComment;
