import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button/button";
import { IconButton } from "./icon-button/icon-button";
import { Popover, PopoverContent } from "./popover/popover";
import { Tooltip } from "./tooltip/tooltip";

const meta: Meta = {
  title: "Components/Overlays",
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj;

export const Tooltips: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16 }}>
      <Tooltip content="导出为 PDF 文件">
        <Button variant="secondary">导出</Button>
      </Tooltip>
      <Tooltip content="删除所选项目">
        <IconButton label="删除" variant="danger">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path
              d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.7 8h5.6l.7-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        </IconButton>
      </Tooltip>
    </div>
  ),
};

export const FilterPopover: Story = {
  render: () => (
    <Popover>
      <Popover.Trigger render={<Button variant="secondary">筛选</Button>} />
      <PopoverContent>
        <Popover.Title className="cwa-design-popover__title">筛选</Popover.Title>
        <Popover.Description className="cwa-design-popover__description">
          按状态与负责人筛选任务，Escape 或点击外部关闭。
        </Popover.Description>
        <Popover.Close render={<Button variant="primary">完成</Button>} />
      </PopoverContent>
    </Popover>
  ),
};
