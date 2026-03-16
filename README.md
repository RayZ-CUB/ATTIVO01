# ATTIVO

**Move · Earn · Own** — A fitness and sports rewards app with 0G integration.

## What it is

ATTIVO is a single-page web app where you:

- **Connect your wallet** (MetaMask, Coinbase Wallet, WalletConnect) on the 0G network
- **Complete daily challenges** (tennis, cycling, workout) and earn ATTIVO points + 0G
- **Create and join events** on the calendar and social feed
- **See your 0G balance** live from the chain

The app uses [0G](https://0g.ai) for:

- **0G Chain** — Wallet connection and live 0G balance (Galileo Testnet)
- **Persistence** — Events saved to `localStorage` (and ready for 0G Storage when using the SDK)

## Run locally

Wallet connections only work over **http** (not `file://`). Use a local server:

```bash
# With Node installed
npx serve .

# Or with Python
python3 -m http.server 8080
```

Then open **http://localhost:3000/attivo-app.html** (or **http://localhost:8080/attivo-app.html** with Python).

## Wallet & 0G Testnet

1. Install [MetaMask](https://metamask.io) (or another Web3 wallet).
2. When you connect, the app will prompt you to add **0G Galileo Testnet** (Chain ID 16602).
3. Get testnet 0G from the [0G Faucet](https://faucet.0g.ai) (0.1 0G/day).

## Project layout

- **attivo-app.html** — Single-page app (HTML, CSS, JS); ethers.js loaded via CDN.
- **docs/0g-ai-context.md** — 0G network config, contract addresses, quick reference.
- **docs/0g-in-attivo-without-changing-functionality.md** — How 0G is used in the app and what’s implemented.

## Links

- [0G Documentation](https://docs.0g.ai)
- [0G AI Context](https://docs.0g.ai/ai-context)
