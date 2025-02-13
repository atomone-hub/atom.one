import "../css/main.css";

(() => {
  // On définit le type pour notre liste de modules
  interface ModuleItem {
    selector: string;
    importer: () => Promise<{ default: (element: HTMLElement) => void }>;
  }

  // Au lieu de stocker juste un path,
  // on stocke directement la fonction d'import (importer).
  // Ainsi Vite détecte et réécrit ces imports en prod.
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
    },
  ];

  // Charge un module si l'élément correspondant existe
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

  // Initialisation : on charge tous les modules
  const initModules = async (): Promise<void> => {
    const promises = modules.map(loadModuleIfExists);
    await Promise.all(promises);
  };

  // Lance l'init une fois le DOM chargé
  document.addEventListener("DOMContentLoaded", initModules);
})();
