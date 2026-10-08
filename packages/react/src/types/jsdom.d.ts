declare module "jsdom" {
  export class JSDOM {
    constructor(html?: string, options?: unknown);
    readonly window: Window & {
      document: Document;
      getComputedStyle: (el: Element) => CSSStyleDeclaration;
    };
  }
}
