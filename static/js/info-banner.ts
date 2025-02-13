class InfoBanner {
  private DOM: {
    el: HTMLElement;
    closebtn?: HTMLElement;
  };

  private static SELECTORS = {
    closebtn: "[data-selector='banner-info-closebtn']",
  };

  constructor(el: HTMLElement) {
    this.DOM = { el };

    el.classList.toggle("hidden", !this.isDisplayed());

    this.DOM.closebtn = el.querySelector<HTMLElement>(InfoBanner.SELECTORS.closebtn) || undefined;
    this.DOM.closebtn?.addEventListener("click", this.hide.bind(this));
  }

  private hide(): void {
    this.DOM.el.classList.add("hidden");
    this.storeHiddenState();
  }

  private storeHiddenState(): void {
    localStorage.setItem("info-banner-hidden", "true");
  }

  private isDisplayed(): boolean {
    return localStorage.getItem("info-banner-hidden") !== "true";
  }
}

export default (el: HTMLElement) => new InfoBanner(el);
