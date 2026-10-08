"use client";

import { useState } from "react";
import { Button } from "@cwa-design/react";
import { IconButton } from "@cwa-design/react";
import { Surface } from "@cwa-design/react";
import { Text } from "@cwa-design/react";
import { RecipeScope as CwaProvider } from "./recipe-scope";

/**
 * F08：媒体工具栏可读配方。按媒体亮/暗/混合选择前景保护策略：
 * - Regular（默认）：正文/控件直接可读，适合大多数媒体；
 * - Clear（显式启用）：仅当媒体与主题方向一致且文字/必要图标有实色底面时使用；
 * - Thick/Solid：复杂混合亮度或要求稳定阅读底面时的回退。
 * 前景保护通过局部实色底面（图标配色 + 局部 Surface）实现，不要求切换站点主题；
 * 文字/图标保持不透明；blur 固定；动效只用 transform/opacity。
 */
export type MediaToolbarTone = "regular" | "clear" | "thick" | "solid";

export interface MediaToolbarRecipeProps {
  /** 初始材质；默认 regular（可读性最稳）。 */
  initialMaterial?: MediaToolbarTone;
  /** 媒体亮度：bright/dark/mixed；用于文案与默认策略说明。 */
  media?: "bright" | "dark" | "mixed";
}

const MATERIAL_BY_TONE = {
  regular: "glass",
  clear: "glass-clear",
  thick: "frosted",
  solid: "solid",
} as const;

/** 媒体工具栏可读配方（F08）。 */
export function MediaToolbarRecipe({
  initialMaterial = "regular",
  media = "mixed",
}: MediaToolbarRecipeProps) {
  const [material, setMaterial] = useState<MediaToolbarTone>(initialMaterial);
  const surfaceMaterial = MATERIAL_BY_TONE[material];
  return (
    <CwaProvider>
      <div
        style={{
          position: "relative",
          minHeight: 280,
          borderRadius: 24,
          overflow: "hidden",
          display: "grid",
          alignContent: "center",
          justifyItems: "center",
          padding: 24,
          background:
            media === "bright"
              ? "linear-gradient(135deg, #bfe0f2, #f3ead8)"
              : media === "dark"
                ? "linear-gradient(135deg, #101b2c, #1d2c46)"
                : "linear-gradient(110deg, #172434 50%, #ebeddf 50%)",
        }}
      >
        <div aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
          <div
            style={{
              position: "absolute",
              top: "18%",
              left: "6%",
              width: 200,
              height: 120,
              borderRadius: 999,
              background: media === "dark" ? "#0c1526" : "#ffffff",
              opacity: 0.6,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "12%",
              right: "8%",
              width: 260,
              height: 140,
              borderRadius: 24,
              background: media === "dark" ? "#22354f" : "#9fc3d8",
              opacity: 0.55,
            }}
          />
        </div>
        <Surface
          material={surfaceMaterial}
          style={{
            position: "relative",
            borderRadius: 20,
            padding: "10px 14px",
            display: "flex",
            gap: 12,
            alignItems: "center",
            maxWidth: "100%",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 39,
              height: 39,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              borderRadius: 9,
              fontSize: 18,
              // F08：图标使用实色底面（局部保护），非文本对比按相邻底色测量。
              color: "#f6ead6",
              background: "linear-gradient(135deg, #346b7f, #1f3f40)",
            }}
          >
            ▶
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ fontSize: 14 }}>
              {media === "dark" ? "夜色山谷" : media === "bright" ? "高山晨光" : "明暗之间"}
            </strong>
            <Text variant="caption" tone="muted" as="p" style={{ margin: 0 }}>
              {material === "clear"
                ? "Clear：媒体方向一致 + 图标实色底面"
                : material === "thick"
                  ? "Thick：混合亮度的稳妥回退"
                  : material === "solid"
                    ? "Solid：最长阅读时间的底面"
                    : "Regular：默认可读"}
            </Text>
          </div>
          {/* 必要图标：♡ 有实色底面（局部 Surface 保护），非文本对比 ≥3:1。 */}
          <Surface
            material="frosted"
            style={{ borderRadius: 999, display: "grid", placeItems: "center" }}
          >
            <IconButton label="收藏" variant="ghost" size="sm">
              ♡
            </IconButton>
          </Surface>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setMaterial((m) =>
                m === "regular"
                  ? "clear"
                  : m === "clear"
                    ? "thick"
                    : m === "thick"
                      ? "solid"
                      : "regular",
              )
            }
          >
            切换材质
          </Button>
        </Surface>
        <Text
          variant="caption"
          tone="muted"
          as="p"
          style={{
            position: "relative",
            margin: "14px 0 0",
            textAlign: "center",
            background: "rgba(255,255,255,0.72)",
            borderRadius: 8,
            padding: "2px 10px",
          }}
        >
          F08 配方：媒体亮暗与前景角色决定材质与保护，不需要切换站点主题。
        </Text>
      </div>
    </CwaProvider>
  );
}
