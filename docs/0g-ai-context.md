# 0G AI Context for Coding

Reference for building on 0G. Full docs: [docs.0g.ai](https://docs.0g.ai). Source: [AI Context page](https://docs.0g.ai/ai-context).

## Network Configurations

### Testnet (Galileo)
| Parameter | Value |
|-----------|--------|
| Network Name | 0G-Galileo-Testnet |
| Chain ID | 16602 |
| RPC | `https://evmrpc-testnet.0g.ai` |
| Block Explorer | https://chainscan-galileo.0g.ai |
| Storage Explorer | https://storagescan-galileo.0g.ai |
| Faucet | https://faucet.0g.ai (0.1 0G/day) |
| Storage Indexer | https://indexer-storage-testnet-turbo.0g.ai |

### Mainnet (Aristotle)
| Parameter | Value |
|-----------|--------|
| Network Name | 0G Mainnet |
| Chain ID | 16661 |
| RPC | `https://evmrpc.0g.ai` |
| Block Explorer | https://chainscan.0g.ai |
| Storage Indexer | https://indexer-storage-turbo.0g.ai |

## Key Contract Addresses (Testnet)
| Contract | Address |
|----------|---------|
| Flow | `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` |
| Mine | `0x00A9E9604b0538e06b268Fb297Df333337f9593b` |
| Reward | `0xA97B57b4BdFEA2D0a25e535bd849ad4e6C440A69` |
| DAEntrance | `0xE75A073dA5bb7b0eC622170Fd268f35E675a957B` |
| DASigners (precompile) | `0x0000000000000000000000000000000000001000` |
| WrappedOGBase (precompile) | `0x0000000000000000000000000000000000001001` |
| Compute Ledger | `0xE70830508dAc0A97e6c087c75f402f9Be669E406` |
| Compute Inference | `0xa79F4c8311FF93C06b8CfB403690cc987c93F91E` |

## 0G Chain (EVM)
- Full EVM compatibility; use Hardhat, Foundry, Remix.
- Hardhat testnet: `url: "https://evmrpc-testnet.0g.ai", chainId: 16602`
- Foundry: `forge create --rpc-url https://evmrpc-testnet.0g.ai --private-key $KEY src/Contract.sol:Contract`

## 0G Storage
- **TS/JS**: `npm install @0glabs/0g-ts-sdk ethers`
- **Python**: `pip install 0g-storage-client`
- Upload (TS): `ZgFile.fromFilePath()` → `file.merkleTree()` → `indexer.upload(file, rpcUrl, signer)`
- Indexer (testnet): `https://indexer-storage-testnet-turbo.0g.ai`

## 0G Compute
- **CLI**: `pnpm add @0glabs/0g-serving-broker -g`
- Web UI: `0g-compute-cli ui start-web` → http://localhost:3090
- OpenAI-compatible: set `base_url` to `<service_url>/v1/proxy` and `api_key` to `app-sk-<SECRET>`

## MetaMask – Add Testnet
```js
chainId: '0x40EA', chainName: '0G-Galileo-Testnet',
nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
rpcUrls: ['https://evmrpc-testnet.0g.ai'],
blockExplorerUrls: ['https://chainscan-galileo.0g.ai']
```

## Links
- Docs: https://docs.0g.ai
- Developer hub: https://docs.0g.ai/developer-hub/getting-started
- Discord: https://discord.gg/0gLabs
- Awesome 0G: https://github.com/0gfoundation/awesome-0g
