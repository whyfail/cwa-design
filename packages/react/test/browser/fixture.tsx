import { createRoot } from "react-dom/client";
import { AccountPanelRecipe, AiWorkspaceRecipe, Button, CwaProvider, Sheet } from "../../src/index";
import "../../src/styles.css";

const params = new URLSearchParams(location.search);
document.documentElement.dir = params.get("rtl") === "1" ? "rtl" : "ltr";
const placement = params.get("placement") === "end" ? "end" : "bottom";
const root = document.getElementById("root");
if (!root) throw new Error("Missing interaction fixture root");
const paragraphs = Array.from({ length: 40 }, (_, index) => `可滚动的第 ${index + 1} 行正文`);

createRoot(root).render(
  <CwaProvider
    theme="dark"
    material={params.get("solid") === "1" ? "solid" : "auto"}
    motion={params.get("reduced") === "1" ? "reduced" : "system"}
  >
    <div style={{ padding: 16, maxWidth: "100%" }}>
      <Sheet placement={placement}>
        <Sheet.Trigger render={<Button>打开测试面板</Button>} />
        <Sheet.Content>
          <Sheet.Title>测试面板</Sheet.Title>
          <Sheet.Description>拖动手柄关闭；正文保留滚动。</Sheet.Description>
          {paragraphs.map((text) => (
            <p key={text}>{text}</p>
          ))}
          <Sheet.Close render={<Button>关闭</Button>} />
        </Sheet.Content>
      </Sheet>
      <div style={{ marginTop: 24 }}>
        <AiWorkspaceRecipe messages={[]} />
      </div>
      <div style={{ marginTop: 24 }}>
        <AccountPanelRecipe />
      </div>
    </div>
  </CwaProvider>,
);
