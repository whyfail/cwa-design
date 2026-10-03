import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../../../packages/react/src/**/*.stories.@(ts|tsx)"],
  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
  viteFinal: (config, { configType }) => {
    // GitHub Pages 子路径部署（项目页）；本地 dev/build 不设则保持根路径。
    config.base =
      process.env.STORYBOOK_BASE ??
      (configType === "PRODUCTION" ? `${process.env.CWA_BASE ?? "/"}storybook/` : "/");
    return config;
  },
};

export default config;
