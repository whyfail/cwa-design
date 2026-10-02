// 全量 meta 索引：静态导入全部 30 个组件的 registry 记录。
// 类型安全（satisfies ComponentRecord 在各 meta 文件约束），构建器直接消费本模块。
import { buttonMeta } from "../../../react/src/button/button.meta.js";
import { iconButtonMeta } from "../../../react/src/icon-button/icon-button.meta.js";
import { providerMeta } from "../../../react/src/provider/provider.meta.js";
import { surfaceMeta } from "../../../react/src/surface/surface.meta.js";
import { stackMeta } from "../../../react/src/stack/stack.meta.js";
import { textMeta } from "../../../react/src/text/text.meta.js";
import { headingMeta } from "../../../react/src/heading/heading.meta.js";
import { fieldMeta } from "../../../react/src/field/field.meta.js";
import { inputMeta } from "../../../react/src/input/input.meta.js";
import { textareaMeta } from "../../../react/src/textarea/textarea.meta.js";
import { separatorMeta } from "../../../react/src/separator/separator.meta.js";
import { badgeMeta } from "../../../react/src/badge/badge.meta.js";
import { avatarMeta } from "../../../react/src/avatar/avatar.meta.js";
import { cardMeta } from "../../../react/src/card/card.meta.js";
import { spinnerMeta } from "../../../react/src/spinner/spinner.meta.js";
import { skeletonMeta } from "../../../react/src/skeleton/skeleton.meta.js";
import { checkboxMeta } from "../../../react/src/checkbox/checkbox.meta.js";
import { radioGroupMeta } from "../../../react/src/radio-group/radio-group.meta.js";
import { switchMeta } from "../../../react/src/switch/switch.meta.js";
import { selectMeta } from "../../../react/src/select/select.meta.js";
import { sliderMeta } from "../../../react/src/slider/slider.meta.js";
import { tabsMeta } from "../../../react/src/tabs/tabs.meta.js";
import { segmentedControlMeta } from "../../../react/src/segmented-control/segmented-control.meta.js";
import { tooltipMeta } from "../../../react/src/tooltip/tooltip.meta.js";
import { popoverMeta } from "../../../react/src/popover/popover.meta.js";
import { dropdownMenuMeta } from "../../../react/src/dropdown-menu/dropdown-menu.meta.js";
import { dialogMeta } from "../../../react/src/dialog/dialog.meta.js";
import { sheetMeta } from "../../../react/src/sheet/sheet.meta.js";
import { toastMeta } from "../../../react/src/toast/toast.meta.js";
import { alertMeta } from "../../../react/src/alert/alert.meta.js";
export const componentMetas = [
    providerMeta,
    surfaceMeta,
    buttonMeta,
    iconButtonMeta,
    stackMeta,
    textMeta,
    headingMeta,
    fieldMeta,
    inputMeta,
    textareaMeta,
    separatorMeta,
    badgeMeta,
    avatarMeta,
    cardMeta,
    spinnerMeta,
    skeletonMeta,
    checkboxMeta,
    radioGroupMeta,
    switchMeta,
    selectMeta,
    sliderMeta,
    tabsMeta,
    segmentedControlMeta,
    tooltipMeta,
    popoverMeta,
    dropdownMenuMeta,
    dialogMeta,
    sheetMeta,
    toastMeta,
    alertMeta,
];
