import "../css/main.css";

(() => {
  interface Module {
    selector: string;
    path: string;
  }

  const modules: Record<string, Module> = {
    infobanner: {
      selector: "info-banner",
      path: "./info-banner.ts",
    },
    tracker: {
      selector: "tracker",
      path: "./tracker.ts",
    },
    newsletter: {
      selector: "newsletter",
      path: "./newsletter.ts",
    },
    chaindata: {
      selector: "chain-data",
      path: "./chaindata.ts",
    },
  };

  const loadModuleIfExists = async ({ selector, path }: Module): Promise<void> => {
    const element = document.querySelector(`[data-component="${selector}"]`);
    if (element) {
      try {
        const module = await import(path);
        module.default(element);
      } catch (err) {
        console.error(`Error while loading script ${path}:`, err);
      }
    } else {
      console.warn(`Module not loaded: no element matches selector "${selector}"`);
    }
  };

  const initModules = async (): Promise<void> => {
    const promises = Object.values(modules).map((module) => loadModuleIfExists(module));
    await Promise.all(promises);
  };

  document.addEventListener("DOMContentLoaded", initModules);
})();
