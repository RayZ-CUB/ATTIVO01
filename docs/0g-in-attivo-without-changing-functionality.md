# 0G in ATTIVO — Add Without Changing Functionality

This doc lists **0G technologies you can plug into your existing ATTIVO app** so that user flows stay the same; only the *backend/source* of data changes.

---

## What your app does today (unchanged)

- **Wallet connect** → MetaMask / Coinbase / WalletConnect (same buttons and flow).
- **Balance hero** → ATTIVO Points + **0G Balance** (same two cards).
- **Challenges** → Complete → earn points + 0G (same cards, timers, “Start” / “Done”).
- **Calendar** → Create event, view calendar, events list (same UI).
- **Social** → View feed, join events, +5 pts (same feed and join flow).

All of the below keep these flows **exactly as they are**; they only change *where* data comes from or *where* it is stored.

---

## 1. 0G Chain (EVM) — **Best fit, no UX change**

Your app already shows **“0G Balance”** and rewards in **0G**. Using 0G Chain only makes that real.

| What you do | What stays the same |
|-------------|----------------------|
| **Wallet connection** | Same connect flow; after connect, ensure the user is on **0G network** (add 0G Testnet/Mainnet if needed, then switch). User still clicks MetaMask/Coinbase/WalletConnect and signs. |
| **0G Balance card** | Same card and label “0G Balance”. Replace the static `12.40` with the **real balance** from 0G Chain (read native 0G or WrappedOGBase at `0x0000...1001` via RPC). |
| **Challenge rewards** | Same challenge completion flow. Optionally: when user completes a challenge, **send real 0G** to their wallet (or record on-chain). UI still shows “+50 PTS”, “0.50 0G”, and toast; only the source of the 0G number and the actual transfer become on-chain. |

**Concrete steps (no functionality change):**

- Use **0G Testnet** for development: RPC `https://evmrpc-testnet.0g.ai`, Chain ID `16602`.
- On connect: call `wallet_addEthereumChain` with 0G Testnet params (see `docs/0g-ai-context.md`) so the wallet switches to 0G.
- Read balance: `eth_getBalance` for native 0G, or call WrappedOGBase `balanceOf(userAddress)`.
- Keep showing that value in `#ogBalance`; keep the same challenge completion logic and, if you want, add a small “send 0G reward” tx in the background after “Done”.

**Result:** Same screens, same actions; wallet is on 0G, balance is live, rewards can be real 0G.

---

## 2. 0G Storage — **Persistence without changing flows**

Right now events and state live only in memory (`userEvents`, etc.); refresh loses them. 0G Storage can persist that **without changing any user-facing functionality**.

| What you do | What stays the same |
|-------------|----------------------|
| **Create Event** | Same form and “Create Event →” button. After adding the event to `userEvents`, **also** upload the event (or full `userEvents` blob) to 0G Storage. User still sees the same confirmation modal and “View in Calendar”. |
| **Calendar / Social** | Same calendar view and social feed. On load, **optionally** restore `userEvents` from 0G Storage (e.g. by root hash you store in `localStorage` or from a known index). If nothing in storage, keep using in-memory/default events as today. |
| **Challenges / Points** | You can persist points and streak to 0G Storage as well; still display and update them the same way in the UI. |

**Concrete steps:**

- Use **0G Storage** with testnet indexer: `https://indexer-storage-testnet-turbo.0g.ai`, RPC `https://evmrpc-testnet.0g.ai`.
- SDK: `@0glabs/0g-ts-sdk` + `ethers`. After `submitEvent()`, serialize `userEvents` (or the new event), upload via the SDK, store the returned root hash (e.g. in `localStorage`) so you can download later.
- On app load (after “wallet connected” or when opening Calendar/Social), if you have a stored root hash, download from 0G Storage and replace or merge `userEvents`. Same render functions; same UI.

**Result:** Same create/view/join event flows; data survives refresh and is stored in a decentralized way.

---

## 3. 0G Compute — **Only if you add new features**

Your app doesn’t use AI today. **0G Compute doesn’t replace any existing feature**; it’s for *new* ones (e.g. “AI coach”, “suggest a challenge”, chat). So:

- **To keep “no change in functionality”:** don’t add 0G Compute.
- **When you want a new AI feature:** use 0G Compute as the backend (OpenAI-compatible API, pay in 0G). That would be an intentional new feature, not a drop-in under this doc.

---

## What’s implemented in ATTIVO

- **0G Chain**: Wallet connect uses 0G (add/switch to 0G Testnet). The “0G Balance” card shows the live balance from chain. After connecting, the wallet pill shows the connected address. Challenge completion still updates the displayed 0G reward; balance is refetched from chain shortly after so it stays in sync.
- **Persistence**: Events are saved to `localStorage` on create and join, and restored on load. The same data can be uploaded to 0G Storage when using the SDK (e.g. in a Vite app with `@0glabs/0g-ts-sdk/browser`); the app calls `window.uploadAttivoEventsTo0G(json, signer)` if defined.

## Summary: what to use without changing functionality

| 0G technology | Use in ATTIVO without changing behavior? | How |
|---------------|-----------------------------------------|-----|
| **0G Chain**  | ✅ Yes | Connect wallet to 0G; show real 0G balance in the same “0G Balance” card; optionally send real 0G on challenge completion. Same UI, same flows. |
| **0G Storage**| ✅ Yes | Persist `userEvents` (and optionally app state) to 0G Storage; restore on load. Same Calendar and Social UX. |
| **0G Compute**| ⚪ Optional | Only when you add new AI features; not required to keep current functionality. |

**Suggested order:**  
1) 0G Chain (wallet + real 0G balance, then optional on-chain rewards).  
2) 0G Storage (persist events/state).  
3) 0G Compute when you decide to add AI.

All references (RPC, chain IDs, contract addresses, Storage indexer, SDKs) are in **`docs/0g-ai-context.md`**.
