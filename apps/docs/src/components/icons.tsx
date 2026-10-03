export function Icon({
  name,
  size = 20,
}: {
  name:
    | "search"
    | "menu"
    | "close"
    | "sun"
    | "moon"
    | "arrow"
    | "copy"
    | "code"
    | "github"
    | "check"
    | "layers"
    | "spark"
    | "sliders";
  size?: number;
}) {
  const paths = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" />
      </>
    ),
    moon: <path d="M20 15.6A9 9 0 0 1 8.4 4a9 9 0 1 0 11.6 11.6Z" />,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="3" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </>
    ),
    code: <path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16" />,
    github: (
      <path d="M9 19c-4.3 1.3-4.3-2-6-2m12 4v-3.4c0-1-.1-1.4-.6-2 3-.3 6.2-1.5 6.2-6.2a4.8 4.8 0 0 0-1.3-3.3c.1-.3.6-1.6-.1-3.2 0 0-1.1-.3-3.5 1.3a12 12 0 0 0-6.4 0C6.9 2.6 5.8 3 5.8 3a4.4 4.4 0 0 0-.1 3.2 4.8 4.8 0 0 0-1.3 3.3c0 4.7 3.2 5.9 6.2 6.2-.4.4-.6 1-.6 2V21" />
    ),
    check: <path d="m5 12 4 4L19 6" />,
    layers: (
      <>
        <path d="m12 3 10 6-10 6L2 9 12 3Zm-9 11 9 5 9-5M3 19l9 5 9-5" />
      </>
    ),
    spark: <path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z" />,
    sliders: (
      <>
        <path d="M4 7h6m4 0h6M4 17h10m4 0h2" />
        <circle cx="12" cy="7" r="2" />
        <circle cx="16" cy="17" r="2" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
