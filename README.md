# Arbitrum airdrop claimer

## Setup

Put your accounts private key in `secrets.json`

Copy `.env.example` and name it `.env`

Put a Arbitrum RPC URL and the address where all the tokens should be transferred in `.env` (copy `.env.example`) at `L2_RPC_URL` and `BANK_ADDRESS`

In order for this program to work you need `node` and `npm` or `yarn` installed.

Once you have those, simply run `yarn build` or `npm run build` and `yarn start` or `npm run start`

## Usage

There are two available mode: NORMAL & TEST. The TEST mode use replicated Arbitrum contract so you can try the whole program before the airdrop is live.
On the day of the airdrop of course you should use the NORMAL mode.

## Contracts

All the test contracts are verified on Arbiscan.

- Official $ARB token: `0x912ce59144191c1204e64559fe8253a0e49e6548`
- Official $ARB airdrop distributor: `0x67a24ce4321ab3af51c2d0a4801c3e111d88c9d9`
- Test $ARB token: `0xE8029576cd99328b4BFB85D6761a0f8244c2AeF1`
- Block contract address (retrive L1 block from L2): `0x16A6A71Ad53d225c96C3345ecCcB4895a4FD1e38`
- Test $ARB airdrop distributor: `0x088Fac410c98b1b7B62C8F62B89AD083Dd120acE`