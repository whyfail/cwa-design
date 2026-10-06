import { IconButton } from "@cwa-design/react";

export function IconButtonBasic() {
  return (
    <IconButton label="关闭" variant="secondary" onClick={() => {}}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          d="M4 4l8 8M12 4l-8 8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </IconButton>
  );
}
