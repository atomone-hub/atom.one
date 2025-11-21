import "../css/main.css";
import "./analytics";

(() => {
  interface ModuleItem {
    selector: string;
    importer: () => Promise<{ default: (element: HTMLElement) => void }>;
  }

  const modules: ModuleItem[] = [
    {
      selector: "info-banner",
      importer: () => import("./info-banner"),
    },
    {
      selector: "tracker",
      importer: () => import("./tracker"),
    },
    {
      selector: "newsletter",
      importer: () => import("./newsletter"),
    },
    {
      selector: "chain-data",
      importer: () => import("./chaindata"),
    }
  ];

  const loadModuleIfExists = async (mod: ModuleItem): Promise<void> => {
    const element = document.querySelector(`[data-component="${mod.selector}"]`);
    if (element) {
      try {
        const m = await mod.importer();
        m.default(element as HTMLElement);
      } catch (err) {
        console.error(`Error while loading script for "${mod.selector}":`, err);
      }
    } else {
      console.warn(`Module not loaded: no element matches selector "${mod.selector}"`);
    }
  };

  const initModules = async (): Promise<void> => {
    new GlobalModule();
    const promises = modules.map(loadModuleIfExists);
    await Promise.all(promises);
  };

  document.addEventListener("DOMContentLoaded", initModules);
})();

class GlobalModule {
  constructor() {
    // Prefect links
    document.querySelectorAll("a").forEach((link) => {
      link.addEventListener("mouseenter", () => {
        const href = link.getAttribute("href");
        if (href && !document.querySelector(`link[rel="prefetch"][href="${href}"]`)) {
          const prefetch = document.createElement("link");
          prefetch.rel = "prefetch";
          prefetch.href = href;
          document.head.appendChild(prefetch);
        }
      });
    });
  }
}
