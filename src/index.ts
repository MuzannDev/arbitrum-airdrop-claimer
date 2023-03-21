import dotenv from 'dotenv'
import { distributor, getCurrentL1Block, handleError } from './utils'
import { beforeTest, handleClaims, prepareTxs } from './handler'
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

dotenv.config()

let startBlock:number = 0
export let DISTRIBUTOR_ADDRESS:string

async function main(){
    console.log('Starting bot.. Remember that you are using an experimental software and therefore expose yourself to potential bugs that can make you lose money.')
    console.log('2 MODES AVAILABLE:')
    console.log('NORMAL: Designed to be used on airdrop day')
    console.log('TEST: Use replicated arbitrum airdrop contracts on Arbitrum mainnet to try a simulation of the claim. THIS WILL COST AS MUCH GAS AS THE NORMAL MODE.')
    const userInput = await rl.question('Which mode would you like to use? ');
     rl.close()
    if (userInput === 'NORMAL'){
        DISTRIBUTOR_ADDRESS = process.env.DISTRIBUTOR_NORMAL_ADDRESS ? process.env.DISTRIBUTOR_NORMAL_ADDRESS : handleError('Missing DISTRIBUTOR_NORMAL_ADDRESS env variable')
        const signedClaims = await prepareTxs(DISTRIBUTOR_ADDRESS)
        let l1Block
        // IF YOU ARE A DEV I STRONGLY RECOMMEND USING WEBSOCKET SUBSCRIPTION INSTEAD
        // OF THIS WORKAROUND, I DID THIS BCS MOST PEOPLE DONT HAVE ACCESS TO WS
        while((l1Block = await getCurrentL1Block()) < startBlock) console.log(`${Date.now()} - Blocks left: ${startBlock - l1Block}`)
        handleClaims(signedClaims)
    }
    else if (userInput === 'TEST'){
        DISTRIBUTOR_ADDRESS = process.env.DISTRIBUTOR_TEST_ADDRESS ? process.env.DISTRIBUTOR_TEST_ADDRESS : handleError('Missing DISTRIBUTOR_NORMAL_ADDRESS env variable')
        await beforeTest()
        const signedTClaims = await prepareTxs(DISTRIBUTOR_ADDRESS)
        handleClaims(signedTClaims) 

    }
    else handleError('Choose either NORMAL or TEST')
}

main()
