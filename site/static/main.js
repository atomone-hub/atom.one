(() => {
  class Tracker {
    constructor(el) {
      this.DOM = {
        tracker: el,
      };

      this.balance = 0;
      this.detail = "";

      this.init();
    }

    init() {
      this.DOM.result = [...this.DOM.tracker.querySelectorAll(".js-tracker-result")];
      this.DOM.balanceTotal = this.DOM.tracker.querySelector(".js-tracker-balanceTotal");
      this.DOM.balanceResult = this.DOM.tracker.querySelector(".js-tracker-balanceResult");
      this.DOM.detail = this.DOM.tracker.querySelector(".js-tracker-detail");
      this.DOM.input = this.DOM.tracker.querySelector(".js-tracker-input");
      this.DOM.check = this.DOM.tracker.querySelector(".js-tracker-check");

      this.DOM.check.addEventListener("click", () => this.checkBalance());
    }

    async checkBalance() {
      const data = await this._getBalance(this.DOM.input.value);
      const balanceTotal = this._normalizeAmount(data.amount);

      this.DOM.balanceResult.textContent = +data.amount > 0 ? `You have received: ${balanceTotal} ATONE` : `You may not be eligible to the AtomOne airdrop`;
      this.DOM.balanceTotal.textContent = balanceTotal;

      this.DOM.result.forEach((result) => result.classList.remove("is-hidden"));
    }

    _rounder(figure) {
      return Math.round(+figure * 100) / 100;
    }
    _normalizeAmount(amount) {
      const roundedAmount = this._rounder(+amount / 1000000);
      return roundedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }

    async _getBalance(cosmosAddress) {
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

      const transformGraphQLResult = (result) => {
        const createDetail = (type, atomAmt, atoneAmt, bonusMalus, multiplier, factor) => ({
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
      };

      try {
        const response = await fetch("https://graphql-dapp.govgen.io/v1/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: queryAtomeOneBalance,
            variables: { addr: cosmosAddress },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        const data = json.data.votes848?.[0];

        if (data) {
          return transformGraphQLResult(data);
        } else {
          return { denom: "uatone", amount: "0" };
        }
      } catch (error) {
        console.error("Error fetching AtomOne balance:", error);
        throw new Error("Could not get AtomOne balances");
      }
    }
  }

  window.addEventListener("load", () => {
    const trackers = [...document.querySelectorAll(".js-tracker")];
    trackers.forEach((el) => new Tracker(el));
  });
})();
