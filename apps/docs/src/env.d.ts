/// <reference types="vite/client" />

declare const __CWA_RELEASE__: {
  version: string;
  commit: string;
  channel: "source";
  dirty?: boolean;
};

declare module "virtual:cwa-site-data" {
  const data: import("./data/types").SiteData;
  export default data;
}
