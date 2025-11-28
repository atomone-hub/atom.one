import { bech32 } from "bech32";
import { track as trackPlausible } from '@plausible-analytics/tracker'

interface BalanceResult {
  amount: string;
  denom: string;
}

class Tracker {
  private DOM: {
    tracker: HTMLElement;
    result?: HTMLElement;
    balanceTotal?: HTMLElement;
    balanceResult?: HTMLElement;
    detail?: HTMLElement;
    input?: HTMLInputElement;
    check?: HTMLButtonElement;
  };

  private balance: number;
  private detail: string;

  private static readonly SELECTORS = {
    result: "[data-selector='result']",
    balanceTotal: ".js-tracker-balanceTotal",
    balanceResult: ".js-tracker-balanceResult",
    detail: "[data-selector='detail']",
    input: "[data-selector='input']",
    check: "[data-selector='check']",
  } as const;

  constructor(el: HTMLElement) {
    this.DOM = { tracker: el };
    this.balance = 0;
    this.detail = "";

    this.init();
  }

  private init(): void {
    this.DOM.result = this.DOM.tracker.querySelector(Tracker.SELECTORS.result) as HTMLElement;
    this.DOM.balanceTotal = this.DOM.tracker.querySelector(Tracker.SELECTORS.balanceTotal) as HTMLElement;
    this.DOM.balanceResult = this.DOM.tracker.querySelector(Tracker.SELECTORS.balanceResult) as HTMLElement;
    this.DOM.detail = this.DOM.tracker.querySelector(Tracker.SELECTORS.detail) as HTMLElement;
    this.DOM.input = this.DOM.tracker.querySelector(Tracker.SELECTORS.input) as HTMLInputElement;
    this.DOM.check = this.DOM.tracker.querySelector(Tracker.SELECTORS.check) as HTMLButtonElement;

    this.DOM.check?.addEventListener("click", () => this.checkBalance());
  }

  private async checkBalance(): Promise<void> {
    if (!this.DOM.input || !this.DOM.input.value) return;

    try {
      const { words } = bech32.decode(this.DOM.input.value);
      const address = bech32.encode("atone", words);

      const data = await this._getBalance(address);
      const balanceTotal = this._normalizeAmount(data.amount);

      if (this.DOM.result && this.DOM.detail) {
        this.DOM.result.textContent = `You have received: ${balanceTotal} $ATONE`;
        this.DOM.result.classList.add(...["text-positive", "pb-2", "mt-8"]);
        this.DOM.result.classList.remove("text-negative");
        this.DOM.detail.textContent = `TOTAL AIRDROP = YES + NO + NWV + ABS + DNV + LIQUID ≃ ${balanceTotal} ATONE`;

        trackPlausible('SubmitFormCheckBalance', {
          props: {
            position: this.DOM.tracker.dataset.position ?? "",
          }
        })
      }
    } catch (error) {
      if (this.DOM.result && this.DOM.detail) {
        this.DOM.result.textContent = `Wrong address or You may not be eligible to the AtomOne airdrop`;
        this.DOM.result.classList.remove("text-positive");
        this.DOM.result.classList.add(...["text-negative", "pb-2", "mt-8"]);
      }
      console.error("Error checking balance:", error);
    }
  }

  private _rounder(figure: number): number {
    return Math.round(figure * 100) / 100;
  }

  private _normalizeAmount(amount: string): string {
    const roundedAmount = this._rounder(+amount / 1_000_000);
    return roundedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  private async _getBalance(cosmosAddress: string): Promise<BalanceResult> {
    const query = `
    query QueryGenesisBalance($address: String!) {
      genesis_balance: balances(where: {_and: {address: {_eq: $address}, _not: {block: {}}}}) {
        address
        coins
      }
    }`;

    try {
      const response = await fetch("https://graphql-atomone-mainnet.allinbits.services/v1/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-role": "anonymous",
        },
        body: JSON.stringify({ query: query, variables: { address: cosmosAddress } }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();

      console.log(json);
      if (!json.data.genesis_balance || json.data.genesis_balance.length === 0) {
        // throw new Error("Not eligible for AtomOne airdrop");
        return { amount: "0", denom: "uatom" };
      }

      return json.data.genesis_balance[0].coins[0];
    } catch (error) {
      console.error("Error fetching AtomOne balance:", error);
      throw new Error("Could not get AtomOne balances");
    }
  }
}

export default (el: HTMLElement) => new Tracker(el);
