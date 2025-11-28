import { init as initPlausible } from '@plausible-analytics/tracker'

declare global {
    interface Window {
      Pixels: {
        fire: (url: string, props?: PixelProps) => void;
        bind: (root?: ParentNode) => void;
      };
    }
}
  
type PixelProps = Record<string, unknown>;

/**
 * Parse a JSON string or a key=value;key2=value2 string into an object.
 * @param value - The string to parse.
 * @returns The parsed object.
 */
function safeJsonParse<T = unknown>(value: string | null): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    // key=value;key2=value2 fallback
    const obj: Record<string, string> = {};
    const parts = value.split(";").map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      const [k, ...rest] = part.split("=");
      if (k) obj[k] = rest.join("=") || "true";
    }
    return obj as unknown as T;
  }
}

/**
 * Send a pixel to the given URL with the given properties. It load the image from the given URL and set the properties as query string in the webpage.
 * @param url - The URL to send the pixel to.
 * @param props - The properties to send with the pixel.
 */
function sendPixel(url: string, props?: PixelProps): void {
  try {
    const u = new URL(url, location.href);
    const qs = new URLSearchParams(u.search);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v === undefined || v === null) continue;
        qs.set(k, String(v));
      }
    }
    u.search = qs.toString();
    const img = new Image(1, 1);
    img.src = u.toString();
  } catch (e) {
    console.warn("[Pixels] send error", e);
  }
}

/**
 * Bind pixels to the given root element.
 * @param root - The root element to bind pixels to.
 */
function bindPixels(root: ParentNode = document): void {
  const selector = "[data-pixel], [data-pixel-url]";
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));

  // Loop through the nodes and bind the pixels to the elements.
  for (const el of nodes) {
    // Get the URL for the pixel.
    const pixelUrl = el.getAttribute("data-pixel") || el.getAttribute("data-pixel-url");
    if (!pixelUrl) continue;

    // Get the triggers for the pixel.
    // eg. click, view, load, etc.
    const triggers = (el.getAttribute("data-pixel-on") || "click")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Get the properties for the pixel.
    // eg. value, event, etc.
    const propsRaw = el.getAttribute("data-pixel-props") || el.getAttribute("data-track-props");
    const baseProps = (safeJsonParse<PixelProps>(propsRaw) || {}) as PixelProps;

    // Prepare the handler function for the pixel to be triggered.
    const handler = (evt?: Event): void => {
      const dynamic: PixelProps = {};
      if (evt && evt.target && "value" in (evt.target as HTMLInputElement)) {
        // Get the value of the input.
        dynamic.value = (evt.target as HTMLInputElement).value;
      }
      // Send the pixel to the given URL with the given properties.
      sendPixel(pixelUrl, { ...baseProps, ...dynamic });
    };

    // Loop through the triggers and bind the pixel to the element.
    for (const ev of triggers) {
      if (ev === "view") {
        // Use Intersection Observer to bind the pixel to the element when it is in the viewport.
        const io = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                handler();
                io.unobserve(el);
              }
            }
          },
          { rootMargin: "0px 0px -10% 0px", threshold: 0.2 }
        );
        io.observe(el);
      } else if (ev === "load") {
        // Fire the pixel immediately when the element is loaded.
        handler();
      } else {
        // Bind the pixel to the element when the trigger is triggered. 
        // eg. click, submit, etc.
        el.addEventListener(ev, handler, { passive: true });
      }
    }
  }
}

/**
 * Declare the Pixels object in the global scope.
 * fire: send a pixel to the given URL with the given properties. Javascript version of the pixel.
 * bind: bind pixels to the given root element. Should be called once again for each new element.
 */
window.Pixels = {
  fire: sendPixel,
  bind: bindPixels,
};


/**
 * Initialize the analytics and bind the pixels to the document.
 */
(() => {
  // Initialize Plausible Analytics
  initPlausible({
    domain: 'atom.one'
  })

  // Bind pixels to the document when the DOM is loaded.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => bindPixels(), { once: true });
  } else {
    bindPixels();
  }
})();


export {};