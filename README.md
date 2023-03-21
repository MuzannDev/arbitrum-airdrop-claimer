# Arbitrum airdrop claimer

## Setup

Put your accounts private key in `secrets.json`

Copy `.env.example` and name it `.env`

Put a Arbitrum RPC URL and the address where all the tokens should be transferred in `.env` (copy `.env.example`) at `L2_RPC_URL` and `BANK_ADDRESS`

In order for this program to work you need `node` and `npm` or `yarn` installed.

Once you have those, simply run `yarn build` or `npm run build` and `yarn start` or `npm run start`