import dotenv from 'dotenv'
import { distributor, getCurrentL1Block, handleError, l2Client, beforeTest } from './utils'
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { handleClaims, prepareClaims } from './claim';

const rl = readline.createInterface({ input, output });

dotenv.config()

export let gasPrice:string
export let DISTRIBUTOR_ADDRESS:string
export let TOKEN_ADDRESS:string

async function main(){
    console.log('Starting bot.. Remember that you are using an experimental software and therefore expose yourself to potential bugs that can make you lose money.')
    console.log('2 MODES AVAILABLE:')
    console.log('NORMAL: Designed to be used on airdrop day')
    console.log('TEST: Use replicated arbitrum airdrop contracts on Arbitrum mainnet to try a simulation of the claim. THIS WILL COST AS MUCH GAS AS THE NORMAL MODE.')
    const userInput = await rl.question('Which mode would you like to use? ');
    rl.close()
    if (userInput === 'NORMAL'){
        gasPrice = (parseInt(await l2Client.eth.getGasPrice()) * 2).toString()
        const startBlock = await distributor.methods.claimPeriodStart().call()
        TOKEN_ADDRESS = process.env.TOKEN_NORMAL_ADDRESS ? process.env.TOKEN_NORMAL_ADDRESS : handleError('Missing TOKEN_NORMAL_ADDRESS env variable')
        DISTRIBUTOR_ADDRESS = process.env.DISTRIBUTOR_NORMAL_ADDRESS ? process.env.DISTRIBUTOR_NORMAL_ADDRESS : handleError('Missing DISTRIBUTOR_NORMAL_ADDRESS env variable')
        const signedClaims = await prepareClaims(DISTRIBUTOR_ADDRESS)
        let l1Block
        // IF YOU ARE A DEV I STRONGLY RECOMMEND USING WEBSOCKET SUBSCRIPTION INSTEAD
        // OF THIS WORKAROUND, I DID THIS BCS MOST PEOPLE DONT HAVE ACCESS TO WS
        while((l1Block = await getCurrentL1Block()) < startBlock) console.log(`${new Date().toLocaleTimeString()} - Blocks left: ${startBlock - l1Block}`)
        handleClaims(signedClaims)
    }
    else if (userInput === 'TEST'){
        gasPrice = (parseInt(await l2Client.eth.getGasPrice()) * 2).toString()
        DISTRIBUTOR_ADDRESS = process.env.DISTRIBUTOR_TEST_ADDRESS ? process.env.DISTRIBUTOR_TEST_ADDRESS : handleError('Missing DISTRIBUTOR_NORMAL_ADDRESS env variable')
        TOKEN_ADDRESS = process.env.TOKEN_TEST_ADDRESS ? process.env.TOKEN_TEST_ADDRESS : handleError('Missing TOKEN_TEST_ADDRESS env variable')
        await beforeTest()
        const signedTClaims = await prepareClaims(DISTRIBUTOR_ADDRESS)
        handleClaims(signedTClaims) 

    }
    else handleError('Choose either NORMAL or TEST')
}

main()
