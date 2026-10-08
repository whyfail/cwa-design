// F05 in-page checker：真实函数（由 page.evaluate(fn, arg) 注入）。
// 断言每个交互目标的裁切、五点命中与焦点可达；输出逐样本明细。
export function inPageChecker({ containers, targets }) {
  const clipsAt = (el) => {
    const cs = getComputedStyle(el);
    return ["hidden", "clip"].some((value) => cs.overflowX === value || cs.overflowY === value);
  };
  const clipAgainst = (element) => {
    const box = element.getBoundingClientRect();
    const bounds = [
      {
        name: "viewport",
        left: 0,
        top: Number.NEGATIVE_INFINITY,
        right: document.documentElement.clientWidth,
        bottom: Number.POSITIVE_INFINITY,
      },
    ];
    for (
      let parent = element.parentElement;
      parent && parent !== document.documentElement;
      parent = parent.parentElement
    ) {
      if (clipsAt(parent)) {
        const parentBox = parent.getBoundingClientRect();
        bounds.push({
          name: "ancestor:" + String(parent.className || parent.tagName).slice(0, 60),
          left: parentBox.left,
          top: parentBox.top,
          right: parentBox.right,
          bottom: parentBox.bottom,
        });
      }
    }
    let worst = { clippedPx: 0, by: "", side: "" };
    for (const bound of bounds) {
      const sides = {
        right: Math.max(0, box.right - bound.right),
        left: Math.max(0, bound.left - box.left),
        bottom: Math.max(0, box.bottom - bound.bottom),
        top: Math.max(0, bound.top - box.top),
      };
      for (const [side, value] of Object.entries(sides))
        if (value > worst.clippedPx)
          worst = { clippedPx: Math.round(value * 100) / 100, by: bound.name, side };
    }
    return worst;
  };
  const pointerEventsBlocking = (to) => {
    // 命中链上任何 pointer-events:none 都会阻断点击。
    let node = to;
    while (node && node !== document.documentElement) {
      if (getComputedStyle(node).pointerEvents === "none") return true;
      node = node.parentElement;
    }
    return false;
  };
  const describe = (el) => ({
    tag: el.tagName.toLowerCase(),
    className: String(el.className).slice(0, 60),
    label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 24),
  });
  const containerRows = [];
  for (const selector of containers) {
    for (const el of document.querySelectorAll(selector)) {
      const box = el.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) continue;
      containerRows.push({ selector, ...describe(el), clip: clipAgainst(el) });
    }
  }
  const targetRows = [];
  for (const target of targets) {
    const elements = [...document.querySelectorAll(target.selector)];
    if (elements.length !== target.expected) {
      targetRows.push({
        selector: target.selector,
        expected: target.expected,
        found: elements.length,
        countError: true,
      });
      continue;
    }
    for (const el of elements) {
      el.scrollIntoView({ block: "center", behavior: "instant" });
      const clip = clipAgainst(el);
      const box = el.getBoundingClientRect();
      const points = [
        ["center", box.left + box.width / 2, box.top + box.height / 2],
        ["top-left", box.left + 3, box.top + 3],
        ["top-right", box.right - 3, box.top + 3],
        ["bottom-left", box.left + 3, box.bottom - 3],
        ["bottom-right", box.right - 3, box.bottom - 3],
      ];
      const misses = [];
      for (const [name, x, y] of points) {
        const hit = document.elementFromPoint(x, y);
        // 合法命中：目标自身、其后代，或目标所属交互面板（click 冒泡可达）。
        // 仅拒绝：完全没有命中、pointer-events 链阻断，或命中完全无关元素。
        const panel = el.closest(
          ".glass-control-panel, .glass-music-bar, .overlay-stage-canvas, .ab-pane",
        );
        const legitimate =
          hit &&
          (hit === el ||
            el.contains(hit) ||
            hit.contains(el) ||
            (panel && panel.contains(hit) && !pointerEventsBlocking(hit)));
        if (!legitimate)
          misses.push({
            point: name,
            hit: hit ? String(hit.className || hit.tagName).slice(0, 50) : "none",
          });
      }
      targetRows.push({
        selector: target.selector,
        kind: target.kind,
        ...describe(el),
        clip,
        hitOk: misses.length === 0,
        misses,
      });
    }
  }
  return { containers: containerRows, targets: targetRows };
}
