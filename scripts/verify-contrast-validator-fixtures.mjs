// F03 负向夹具（纯 Node，无需浏览器）：采样校验器必须拒绝零样本、空框、
// 越界框与圆角容器整框误采路径。
import assert from "node:assert/strict";
import { validateSamples } from "./verify-composite-contrast.mjs";

const mustThrow = (name, fn) => {
  try {
    fn();
  } catch (error) {
    console.log(`ok: ${name} → ${(error.message ?? "").slice(0, 90)}`);
    return;
  }
  throw new Error(`negative fixture not rejected: ${name}`);
};

const mustPass = (name, fn) => {
  fn();
  console.log(`ok: ${name}`);
};

// 1) 零样本（空选择器/markup 漂移）必须失败。
mustThrow("zero-samples", () =>
  validateSamples([], { expectedCount: 9, imageWidth: 1000, imageHeight: 800, tags: "zero" }),
);

// 2) 样本数不符（预期 9，实际 3）必须失败。
mustThrow("wrong-count", () =>
  validateSamples(
    [
      {
        text: "a",
        rgb: [0, 0, 0],
        box: [1, 1, 10, 10],
        sampleType: "text",
        minimumUnrounded: 5,
        sampledPixelCount: 100,
        boxInsideImage: true,
      },
      {
        text: "b",
        rgb: [0, 0, 0],
        box: [1, 20, 10, 10],
        sampleType: "text",
        minimumUnrounded: 5,
        sampledPixelCount: 100,
        boxInsideImage: true,
      },
      {
        text: "c",
        rgb: [0, 0, 0],
        box: [1, 40, 10, 10],
        sampleType: "text",
        minimumUnrounded: 5,
        sampledPixelCount: 100,
        boxInsideImage: true,
      },
    ],
    { expectedCount: 9, imageWidth: 1000, imageHeight: 800, tags: "count" },
  ),
);

// 3) 越界框必须失败。
mustThrow("box-outside-image", () =>
  validateSamples(
    [
      {
        text: "x",
        rgb: [0, 0, 0],
        box: [990, 790, 40, 20],
        sampleType: "text",
        minimumUnrounded: 5,
        sampledPixelCount: 100,
        boxInsideImage: false,
        error: "box-outside-image-or-empty",
      },
    ],
    { expectedCount: 1, imageWidth: 1000, imageHeight: 800, tags: "outside" },
  ),
);

// 4) 空框（宽或高为 0）必须失败。
mustThrow("empty-box", () =>
  validateSamples(
    [
      {
        text: "x",
        rgb: [0, 0, 0],
        box: [10, 10, 0, 0],
        sampleType: "text",
        minimumUnrounded: null,
        sampledPixelCount: 0,
        boxInsideImage: true,
      },
    ],
    { expectedCount: 1, imageWidth: 1000, imageHeight: 800, tags: "empty" },
  ),
);

// 5) 合法的分类样本集（文字 + 内缩装饰 + 必要图标）必须通过。
mustPass("classified-samples-valid", () =>
  validateSamples(
    [
      {
        text: "标题",
        rgb: [255, 255, 255],
        box: [10, 10, 100, 24],
        sampleType: "text",
        threshold: 4.5,
        minimumUnrounded: 7.2,
        sampledPixelCount: 2400,
        boxInsideImage: true,
      },
      {
        text: "▶",
        rgb: [246, 234, 214],
        box: [10, 40, 39, 39],
        insetRatio: 0.3,
        sampleType: "decorative-glyph-on-solid-tile",
        threshold: 3.0,
        minimumUnrounded: 5.93,
        sampledPixelCount: 300,
        boxInsideImage: true,
      },
      {
        text: "♡",
        rgb: [255, 255, 255],
        box: [60, 40, 24, 24],
        sampleType: "necessary-icon",
        threshold: 3.0,
        minimumUnrounded: 4.8,
        sampledPixelCount: 500,
        boxInsideImage: true,
      },
    ],
    { expectedCount: 3, imageWidth: 1000, imageHeight: 800, tags: "valid" },
  ),
);

console.log("Contrast validator negative fixtures: all rejected as expected.");
