import {
  Button,
  Dialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  Popover,
  PopoverContent,
  Select,
  SelectContent,
  SelectItem,
  Sheet,
  Text,
} from "@cwa-design/react";
import { type ReactElement, useState } from "react";

/**
 * 浮层材质对照舞台（N07）：Popover / DropdownMenu / Select / Dialog / Sheet
 * 共用同一块真实媒体背景，打开后覆盖选中、禁用、焦点等适用状态。
 * 只有非模态 Popover 默认打开；菜单/选择器/模态浮层由用户触发，避免劫持页面焦点。
 * 背景素材与来源记录见 public/media/MEDIA-SOURCES.md；自绘分区是可复现基线。
 */
const STAGE_MEDIAS = [
  {
    value: "real-bright",
    label: "真实亮照片",
    src: `${import.meta.env.BASE_URL}media/photo-real-bright.jpg`,
  },
  {
    value: "real-dark",
    label: "真实暗照片",
    src: `${import.meta.env.BASE_URL}media/photo-real-dark.jpg`,
  },
  { value: "split", label: "自绘明暗分区", src: "" },
] as const;

export type StageMedia = (typeof STAGE_MEDIAS)[number]["value"];

export function OverlayMediaPicker({
  media,
  onChange,
}: {
  media: StageMedia;
  onChange: (media: StageMedia) => void;
}) {
  return (
    <div className="overlay-stage-picker" role="group" aria-label="对照背景">
      {STAGE_MEDIAS.map((item) => (
        <button
          key={item.value}
          type="button"
          aria-pressed={media === item.value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function StageBackdrop({ media }: { media: StageMedia }) {
  const item = STAGE_MEDIAS.find((entry) => entry.value === media)!;
  if (item.value === "split") {
    return <div className="overlay-stage-media overlay-stage-media--split" aria-hidden="true" />;
  }
  return (
    <img className="overlay-stage-media" src={item.src} alt="" aria-hidden="true" loading="eager" />
  );
}

function PopoverScene() {
  return (
    <Popover defaultOpen>
      <Popover.Trigger render={<Button variant="secondary">打开说明</Button>} />
      <PopoverContent>
        <Popover.Title>媒体上的浮层</Popover.Title>
        <Popover.Description>
          透色、边缘与阴影压在真实照片上检查；Tab 可把焦点移到按钮。
        </Popover.Description>
        <Popover.Close render={<Button variant="ghost">关闭</Button>} />
      </PopoverContent>
    </Popover>
  );
}

function MenuScene() {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger render={<Button variant="secondary">项目操作</Button>} />
      <DropdownMenuContent>
        <DropdownMenuItem>复制链接</DropdownMenuItem>
        <DropdownMenuItem>归档项目</DropdownMenuItem>
        <DropdownMenuItem disabled>删除（无权限）</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SelectScene() {
  return (
    <Select
      defaultValue="design"
      items={{ design: "设计团队", engineering: "研发团队", archived: "已归档" }}
    >
      <Select.Trigger aria-label="工作区">
        <Select.Value />
      </Select.Trigger>
      <SelectContent>
        <SelectItem value="design">设计团队</SelectItem>
        <SelectItem value="engineering">研发团队</SelectItem>
        <SelectItem value="archived" disabled>
          已归档（不可选）
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

function DialogScene() {
  return (
    <Dialog>
      <Dialog.Trigger render={<Button>新建工作区</Button>} />
      <Dialog.Content>
        <Dialog.Title>媒体上的对话框</Dialog.Title>
        <Dialog.Description>模态玻璃（thick）配遮罩；确认按钮可 Tab 聚焦。</Dialog.Description>
        <Dialog.Close render={<Button variant="secondary">关闭</Button>} />
      </Dialog.Content>
    </Dialog>
  );
}

function SheetScene() {
  return (
    <Sheet placement="bottom">
      <Sheet.Trigger render={<Button variant="secondary">查看详细信息</Button>} />
      <Sheet.Content>
        <Sheet.Title>媒体上的抽屉</Sheet.Title>
        <Sheet.Description>底部抽屉盖在照片上，检查边缘与投影。</Sheet.Description>
        <Sheet.Close render={<Button variant="secondary">关闭</Button>} />
      </Sheet.Content>
    </Sheet>
  );
}

const SCENES: Record<string, () => ReactElement> = {
  popover: PopoverScene,
  "dropdown-menu": MenuScene,
  select: SelectScene,
  dialog: DialogScene,
  sheet: SheetScene,
};

export function OverlayMaterialStage({ id }: { id: string }) {
  const [media, setMedia] = useState<StageMedia>("real-bright");
  const Scene = SCENES[id];
  if (!Scene) return null;
  return (
    <div className="overlay-stage" data-overlay-stage={id}>
      <div className="overlay-stage-toolbar">
        <OverlayMediaPicker media={media} onChange={setMedia} />
        <Text variant="caption" tone="muted" as="span">
          打开、选中、禁用与焦点状态叠加在同一背景上；Tab 检查焦点可见性。
        </Text>
      </div>
      <div className="overlay-stage-canvas">
        <StageBackdrop media={media} />
        <div className="overlay-stage-anchor">
          <Scene />
        </div>
      </div>
    </div>
  );
}
