import type { Preview } from "@storybook/react-vite";
import "@cwa-design/react/styles.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      options: {
        light: { value: "#f5f5f7" },
        dark: { value: "#1c1c1e" },
        photo: { value: "linear-gradient(135deg, #0a84ff, #bf5af2, #ff375f)" },
      },
    },
  },
};

export default preview;
