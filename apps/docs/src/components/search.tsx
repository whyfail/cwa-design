import { Dialog, IconButton, Input } from "@cwa-design/react";
import { useEffect, useId, useState } from "react";
import { href, searchRoutes } from "../routes";
import { Icon } from "./icons";

function SearchField({
  query,
  setQuery,
  close,
}: {
  query: string;
  setQuery: (value: string) => void;
  close?: () => void;
}) {
  const [active, setActive] = useState(0);
  const prefix = useId();
  const results = searchRoutes(query);
  return (
    <div className="search-content">
      <div className="search-input-row">
        <Icon name="search" />
        <Input
          aria-label="搜索组件和文档"
          role="combobox"
          aria-expanded="true"
          aria-controls={`${prefix}-results`}
          aria-autocomplete="list"
          aria-activedescendant={results[active] ? `${prefix}-result-${active}` : undefined}
          value={query}
          placeholder="搜索组件、文档或使用场景…"
          autoFocus
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((value) => Math.max(0, Math.min(results.length - 1, value + 1)));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((value) => Math.max(0, value - 1));
            }
            if (event.key === "Enter" && results[active]) {
              event.preventDefault();
              window.location.assign(href(results[active].path));
            }
            if (event.key === "Escape") close?.();
          }}
        />
        {query ? (
          <IconButton
            label="清除搜索"
            size="sm"
            variant="ghost"
            onClick={() => {
              setQuery("");
              setActive(0);
            }}
          >
            <Icon name="close" size={16} />
          </IconButton>
        ) : null}
      </div>
      <p className="search-label" role="status">
        {query ? `${results.length} 条匹配结果` : "常用入口"}
      </p>
      <div id={`${prefix}-results`} role="listbox" aria-label="搜索结果" className="search-results">
        {results.map((route, index) => (
          <a
            key={route.path}
            id={`${prefix}-result-${index}`}
            role="option"
            aria-selected={index === active}
            tabIndex={-1}
            className={index === active ? "is-active" : ""}
            href={href(route.path)}
            onMouseEnter={() => setActive(index)}
          >
            <div>
              <strong>{route.title}</strong>
              <span>{route.description}</span>
            </div>
            <Icon name="arrow" size={17} />
          </a>
        ))}
      </div>
      {results.length === 0 ? (
        <div className="search-empty">
          <strong>没有找到相关内容</strong>
          <p>试试“按钮”“弹窗”“安装”“主题”或“MCP”。</p>
          <button
            type="button"
            className="site-text-button"
            onClick={() => {
              setQuery("");
              setActive(0);
            }}
          >
            清除搜索
          </button>
        </div>
      ) : null}
      <div className="search-hints">
        <span>↑ ↓ 选择</span>
        <span>↵ 打开</span>
        <span>esc 关闭</span>
      </div>
    </div>
  );
}
export function SearchDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        render={
          <button type="button" className="site-search-trigger" aria-label="搜索文档">
            <Icon name="search" size={17} />
            <span>搜索文档</span>
            <kbd>⌘ K</kbd>
          </button>
        }
      />
      <Dialog.Content material="solid" className="site-search-dialog">
        <Dialog.Title className="site-sr-only">搜索文档</Dialog.Title>
        <Dialog.Description className="site-sr-only">
          用方向键选择结果，Enter 打开，Escape 关闭。
        </Dialog.Description>
        <SearchField query={query} setQuery={setQuery} close={() => setOpen(false)} />
        <Dialog.Close
          render={
            <button type="button" className="site-sr-only">
              关闭搜索
            </button>
          }
        />
      </Dialog.Content>
    </Dialog>
  );
}
export function SearchPage() {
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setQuery(new URL(window.location.href).searchParams.get("q") ?? "");
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      const url = new URL(window.location.href);
      if (query) url.searchParams.set("q", query);
      else url.searchParams.delete("q");
      window.history.replaceState(null, "", url);
    }
  }, [query, ready]);
  return (
    <>
      <h2 className="site-sr-only">搜索结果</h2>
      <SearchField query={query} setQuery={setQuery} />
    </>
  );
}
