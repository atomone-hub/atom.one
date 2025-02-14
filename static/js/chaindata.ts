interface ChainDataDOM {
  el: HTMLElement;
  blocktime?: HTMLElement;
  numberofblocks?: HTMLElement;
  activevalidators?: HTMLElement;
  accounts?: HTMLElement;
  proposals?: HTMLElement;
}

class ChainData {
  private DOM: ChainDataDOM;

  private static readonly QUERY = `
      query ChainInfosNew {
        averageBlockTime: average_block_time_per_hour {
          averageTime: average_time
        }
        account_aggregate {
          aggregate {
            count
          }
        }
        block_aggregate {
          aggregate {
            count
          }
        }
        activeTotal: block(limit: 1, order_by: { height: desc }) {
          height
          validator_statuses_aggregate(where: { status: { _eq: "BOND_STATUS_BONDED" } }) {
            aggregate {
              count
            }
          }
        }
        inactiveTotal: block(limit: 1, order_by: { height: desc }) {
          height
          validator_statuses_aggregate(where: { status: { _neq: "BOND_STATUS_BONDED" } }) {
            aggregate {
              count
            }
          }
        }
        total: block(limit: 1, order_by: { height: desc }) {
          height
          validator_statuses_aggregate {
            aggregate {
              count
            }
          }
        }
        actionable_proposals: proposal_aggregate(
          where: {
            _or: [
              { status: { _eq: "PROPOSAL_STATUS_DEPOSIT_PERIOD" } }
              { status: { _eq: "PROPOSAL_STATUS_VOTING_PERIOD" } }
            ]
          }
        ) {
          aggregate {
            count
          }
        }
        voting_proposals: proposal_aggregate(
          where: { status: { _eq: "PROPOSAL_STATUS_VOTING_PERIOD" } }
        ) {
          aggregate {
            count
          }
        }
        all_proposals: proposal_aggregate {
          aggregate {
            count
          }
        }
      }
    `;

  private static readonly SELECTORS = {
    blocktime: "[data-selector='block-time']",
    numberofblocks: "[data-selector='number-of-blocks']",
    activevalidators: "[data-selector='active-validators']",
    accounts: "[data-selector='accounts']",
    proposals: "[data-selector='active-proposals']",
  };

  constructor(
    private el: HTMLElement,
    private endpoint: string
  ) {
    this.DOM = {
      el,
      blocktime: el.querySelector<HTMLElement>(ChainData.SELECTORS.blocktime) || undefined,
      numberofblocks: el.querySelector<HTMLElement>(ChainData.SELECTORS.numberofblocks) || undefined,
      activevalidators: el.querySelector<HTMLElement>(ChainData.SELECTORS.activevalidators) || undefined,
      accounts: el.querySelector<HTMLElement>(ChainData.SELECTORS.accounts) || undefined,
      proposals: el.querySelector<HTMLElement>(ChainData.SELECTORS.proposals) || undefined,
    };

    this.fetchAndUpdate();

    setInterval(() => this.fetchAndUpdate(), 5000);
  }

  private async fetchAndUpdate(): Promise<void> {
    try {
      const result = await this.executeGraphQLQuery(ChainData.QUERY);
      this.updateDomElements(result);
    } catch (error) {
      console.error("GraphQL loading error:", error);
    }
  }

  private async executeGraphQLQuery(query: string, variables?: Record<string, any>): Promise<any> {
    const body = JSON.stringify({
      query,
      variables: variables || {},
    });

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const json = await response.json();

    if (json.errors) {
      console.error("GraphQL Errors:", json.errors);
      throw new Error("GraphQL Error: " + JSON.stringify(json.errors));
    }
    return json.data;
  }

  private updateDomElements(data: any): void {
    const accountsCount = Number(data?.account_aggregate?.aggregate?.count ?? 0);
    const blockTimeAvg = Number(data?.averageBlockTime?.[0]?.averageTime ?? 0).toFixed(1);
    const blockCount = Number(data?.block_aggregate?.aggregate?.count ?? 0);
    const activeValCount = Number(data?.activeTotal?.[0]?.validator_statuses_aggregate?.aggregate?.count ?? 0);

    const actionableProposals = Number(data?.actionable_proposals?.aggregate?.count ?? 0);
    // const votingProposals = Number(data?.voting_proposals?.aggregate?.count ?? 0);
    // const depositPeriod = actionableProposals - votingProposals;

    if (this.DOM.accounts) {
      this.DOM.accounts.textContent = accountsCount.toString();
    }
    if (this.DOM.blocktime) {
      this.DOM.blocktime.textContent = `${blockTimeAvg}s`;
    }
    if (this.DOM.numberofblocks) {
      this.DOM.numberofblocks.textContent = blockCount.toString();
    }
    if (this.DOM.activevalidators) {
      this.DOM.activevalidators.textContent = activeValCount.toString();
    }
    if (this.DOM.proposals) {
      this.DOM.proposals.textContent = `${actionableProposals}`;
      // this.DOM.proposals.textContent = `${actionableProposals} (Voting: ${votingProposals}, Deposit: ${depositPeriod})`; // all props details
    }
  }
}

export default (el: HTMLElement) => new ChainData(el, "https://graphql-atomone-mainnet.allinbits.services/v1/graphql");
