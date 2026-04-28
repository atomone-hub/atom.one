import "katex/dist/katex.min.css";
import renderMathInElement from "katex/contrib/auto-render";

export default function (element: HTMLElement): void {
  renderMathInElement(element, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
      { left: "\\[", right: "\\]", display: true },
    ],
    throwOnError: false,
  });
}
