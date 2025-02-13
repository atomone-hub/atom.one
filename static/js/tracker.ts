class Tracker {
  private DOM: {
    tracker: HTMLElement;
    result?: HTMLElement[];
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
    // balanceTotal: ".js-tracker-balanceTotal",
    // balanceResult: ".js-tracker-balanceResult",
    detail: "[data-selector='detail']",
    input: "[data-selector='input']",
    check: "[data-selector='check']",
  } as const;

  constructor(el: HTMLElement) {
    this.DOM = { tracker: el };
    this.balance = 0;
    this.detail = "";

    console.log("bal");

    this.init();
  }

  private init(): void {
    this.DOM.result = Array.from(this.DOM.tracker.querySelectorAll(Tracker.SELECTORS.result));
    // this.DOM.balanceTotal = this.DOM.tracker.querySelector(Tracker.SELECTORS.balanceTotal) as HTMLElement;
    // this.DOM.balanceResult = this.DOM.tracker.querySelector(Tracker.SELECTORS.balanceResult) as HTMLElement;
    this.DOM.detail = this.DOM.tracker.querySelector(Tracker.SELECTORS.detail) as HTMLElement;
    this.DOM.input = this.DOM.tracker.querySelector(Tracker.SELECTORS.input) as HTMLInputElement;
    this.DOM.check = this.DOM.tracker.querySelector(Tracker.SELECTORS.check) as HTMLButtonElement;

    this.DOM.check?.addEventListener("click", () => this.checkBalance());
  }

  private async checkBalance(): Promise<void> {
    if (!this.DOM.input || !this.DOM.input.value) return;

    try {
      const data = await this._getBalance(this.DOM.input.value);
      const balanceTotal = this._normalizeAmount(data.amount);

      if (this.DOM.balanceResult && this.DOM.detail) {
        this.DOM.balanceResult.textContent = +data.amount > 0 ? `You have received: ${balanceTotal} ATONE` : `You may not be eligible for the AtomOne airdrop`;
        this.DOM.detail.textContent = `TOTAL AIRDROP = YES + NO + NWV + ABS + DNV + LIQUID ≃  ${balanceTotal}`;
      }

      this.DOM.result?.forEach((result) => result.classList.remove("is-hidden"));
    } catch (error) {
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
    const queryAtomeOneBalance = `
        query ($addr: String!) {
          votes848(where: { address: { _eq: $addr } }) {
            address
            total_atone_amount
            factor
            yes_atom_amount
            yes_atone_amount
            yes_bonus_malus
            yes_multiplier
            no_atom_amount
            no_atone_amount
            no_bonus_malus
            no_multiplier
            nwv_atom_amount
            nwv_atone_amount
            nwv_bonus_malus
            nwv_multiplier
            abs_atom_amount
            abs_atone_amount
            abs_bonus_malus
            abs_multiplier
            dnv_atom_amount
            dnv_atone_amount
            dnv_bonus_malus
            dnv_multiplier
            liquid_atom_amount
            liquid_atone_amount
            liquid_bonus_malus
            liquid_multiplier
          }
        }
      `;

    try {
      const response = await fetch("https://graphql-dapp.govgen.io/v1/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryAtomeOneBalance, variables: { addr: cosmosAddress } }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      const data = json.data.votes848?.[0];

      return data ? this._transformGraphQLResult(data) : { denom: "uatone", amount: "0", detail: {} };
    } catch (error) {
      console.error("Error fetching AtomOne balance:", error);
      throw new Error("Could not get AtomOne balances");
    }
  }

  private _transformGraphQLResult(result: any): BalanceResult {
    const createDetail = (type: string, atomAmt: string, atoneAmt: string, bonusMalus: string, multiplier: string, factor: string): BalanceDetail => ({
      type,
      atomAmt,
      atoneAmt,
      bonusMalus,
      multiplier,
      factor,
    });

    return {
      amount: result.total_atone_amount,
      denom: "uatone",
      detail: {
        yesDetail: createDetail("yes", result.yes_atom_amount, result.yes_atone_amount, result.yes_bonus_malus, result.yes_multiplier, result.factor),
        noDetail: createDetail("no", result.no_atom_amount, result.no_atone_amount, result.no_bonus_malus, result.no_multiplier, result.factor),
        nwvDetail: createDetail("nwv", result.nwv_atom_amount, result.nwv_atone_amount, result.nwv_bonus_malus, result.nwv_multiplier, result.factor),
        absDetail: createDetail("abs", result.abs_atom_amount, result.abs_atone_amount, result.abs_bonus_malus, result.abs_multiplier, result.factor),
        dnvDetail: createDetail("dnv", result.dnv_atom_amount, result.dnv_atone_amount, result.dnv_bonus_malus, result.dnv_multiplier, result.factor),
        liquidDetail: createDetail("liquid", result.liquid_atom_amount, result.liquid_atone_amount, result.liquid_bonus_malus, result.liquid_multiplier, result.factor),
      },
    };
  }
}

interface BalanceDetail {
  type: string;
  atomAmt: string;
  atoneAmt: string;
  bonusMalus: string;
  multiplier: string;
  factor: string;
}

interface BalanceResult {
  amount: string;
  denom: string;
  detail: {
    yesDetail?: BalanceDetail;
    noDetail?: BalanceDetail;
    nwvDetail?: BalanceDetail;
    absDetail?: BalanceDetail;
    dnvDetail?: BalanceDetail;
    liquidDetail?: BalanceDetail;
  };
}

export default (el: HTMLElement) => new Tracker(el);
