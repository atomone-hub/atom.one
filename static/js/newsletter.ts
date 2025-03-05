import jsonp from "jsonp";

class Newsletter {
  private DOM: {
    el: HTMLElement;
    result?: HTMLElement;
    detail?: HTMLElement;
    input?: HTMLInputElement;
    check?: HTMLElement;
  };

  private api: string;
  private tag: string | undefined;

  private static readonly SELECTORS = {
    result: "[data-selector='result']",
    detail: "[data-selector='detail']",
    input: "[data-selector='input']",
    check: "[data-selector='check']",
  };

  constructor(el: HTMLElement) {
    this.DOM = { el };

    this.DOM.input = el.querySelector<HTMLInputElement>(Newsletter.SELECTORS.input) || undefined;
    this.DOM.check = el.querySelector<HTMLElement>(Newsletter.SELECTORS.check) || undefined;
    this.DOM.result = el.querySelector<HTMLElement>(Newsletter.SELECTORS.result) || undefined;

    this.api = el.dataset.api ?? "";
    this.tag = el.dataset.tag;

    this.DOM.check?.addEventListener("click", this.registerEmail.bind(this));
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async registerEmail(): Promise<void> {
    if (this.DOM.input?.value === "") return;

    const userEmail = (this.DOM.input as HTMLInputElement).value;

    if (!this.isValidEmail(userEmail)) {
      if (this.DOM.result) {
        this.DOM.result.innerText = "Please, input a valid email address";
        this.DOM.result.classList.remove("text-positive");
        this.DOM.result.classList.add(...["text-negative", "pb-2", "mt-8"]);
      }
      return;
    }

    const tagParam = this.tag ? `&tags=${this.tag}` : "";
    const requestUrl = `${this.api}&EMAIL=${encodeURIComponent(userEmail)}${tagParam}`;

    jsonp(requestUrl, { param: "c" }, (_: any, data: any) => {
      const { msg, result } = data;
      if (this.DOM.result) {
        if (result === "success") {
          this.DOM.result.innerText = "SUCCESSFULLY SUBSCRIBED";
          this.DOM.result.classList.remove("text-negative");
          this.DOM.result.classList.add(...["text-positive", "pb-2", "mt-8"]);
        } else {
          this.DOM.result.innerText = "Please, input correct email";
          this.DOM.result.classList.remove("text-positive");
          this.DOM.result.classList.add(...["text-negative", "pb-2", "mt-8"]);
        }
      }
    });
  }
}

export default (el: HTMLElement) => new Newsletter(el);
