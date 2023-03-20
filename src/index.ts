import Web3 from 'web3'
import dotenv from 'dotenv'
import secrets from '../secrets.json'
import DISTRIBUTOR_ABI from './abi/distributor.json'
import { AbiItem } from 'web3-utils'
dotenv.config()

interface SignedTransaction{
    rawTransaction?: string
}

let startBlock:number = 0

const l2Client = new Web3(process.env.L2_RPC ? process.env.L2_RPC : process.exit(1))
const l1Client = new Web3(process.env.L1_RPC ? process.env.L1_RPC : process.exit(1))
const DISTRIBUTOR_ADDY = process.env.DISTRIBUTOR_ADDRESS ? process.env.DISTRIBUTOR_ADDRESS : process.exit(1)
const distributor = new l2Client.eth.Contract(DISTRIBUTOR_ABI as AbiItem[], DISTRIBUTOR_ADDY)

async function getNonce(privateKey: string){
    const address = l2Client.eth.accounts.privateKeyToAccount(privateKey)
    const nonce = await l2Client.eth.getTransactionCount(address.address)
    return nonce
}



async function prepareTxs(){
    // calculate current gas 
    const gasPrice = await l2Client.eth.getGasPrice()
    // generate calldata for claim
    const claimData = distributor.methods.claim()    
    // encode & sign tx
    let signedQuery = secrets.map(async privateKey => {
        const nonce = await getNonce(privateKey)
        return l2Client.eth.accounts.signTransaction({
            to: DISTRIBUTOR_ADDY,
            data: claimData.encodeABI(),
            nonce,
            gasPrice,
            gas: '1000000'
        }, privateKey)
    })
    return await Promise.all(signedQuery)
}

async function startClaims(signedClaims: SignedTransaction[]){
    let sendClaims = signedClaims.map(c => c.rawTransaction ? l2Client.eth.sendSignedTransaction(c.rawTransaction) : undefined)
    sendClaims.forEach((tx, index) => {
        tx?.on('transactionHash', txhash => {
            console.log(`Account ${index}: Tx sent > ${txhash}`)
        })
        tx?.on('confirmation', confirmationNumber  => {
            if (confirmationNumber == 1) console.log(`Account ${index}: Tx mined`)
        })
        tx?.on('error', error => {
            console.log(`Account ${index}: An error happened with your tx`)
        })
    })
    // send txs
    await Promise.all(signedClaims)
}

async function main(){
    console.log('Starting bot..')
    // Load claim start
    startBlock = await distributor.methods.claimPeriodStart().call()
    // Load tx data
    const signedClaims = await prepareTxs()
    // IF YOU ARE A DEV I STRONGLY RECOMMEND USING WEBSOCKET SUBSCRIPTION INSTEAD
    // OF THIS WORKAROUND, I DID THIS BCS MOST PEOPLE DONT HAVE ACCESS TO WS
    let l1Block
    while((l1Block = await l1Client.eth.getBlockNumber()) < startBlock) console.log(`Blocks left: ${startBlock - l1Block}`)
    startClaims(signedClaims)
}

main()
