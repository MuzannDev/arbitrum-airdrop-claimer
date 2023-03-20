import Web3 from 'web3'
import dotenv from 'dotenv'
import secrets from '../secrets.json'
import DISTRIBUTOR_ABI from './abi/distributor.json'
import { AbiItem } from 'web3-utils'
dotenv.config()

export const ethClient = new Web3(process.env.RPC_URL ? process.env.RPC_URL : process.exit(1))
const DISTRIBUTOR_ADDY = process.env.DISTRIBUTOR_ADDRESS ? process.env.DISTRIBUTOR_ADDRESS : process.exit(1)
export const distributor = new ethClient.eth.Contract(DISTRIBUTOR_ABI as AbiItem[], DISTRIBUTOR_ADDY)

async function getNonce(privateKey: string){
    const address = ethClient.eth.accounts.privateKeyToAccount(privateKey)
    const nonce = await ethClient.eth.getTransactionCount(address.address)
    return nonce
}

async function main(){
    console.log('Starting bot..')
    // Load claim start
    const claimStartTimestamp = await distributor.methods.claimPeriodStart().call()
    while(Date.now() < claimStartTimestamp * 1000) console.log(`Remaining time: ${claimStartTimestamp * 1000 - Date.now()}`)
    // calculate current gas 
    const gasPrice = await ethClient.eth.getGasPrice()
    // generate calldata
    const claimData = distributor.methods.claim()
    // encode & sign tx
    const signedQuery = secrets.map(async privateKey => {
        const nonce = await getNonce(privateKey)
        return ethClient.eth.accounts.signTransaction({
            to: DISTRIBUTOR_ADDY,
            data: claimData.encodeABI(),
            nonce,
            gasPrice,
            gas: '1000000'
        }, privateKey)
    })
    const signedClaims = await Promise.all(signedQuery)
    const sendClaims = signedClaims.map(c => c.rawTransaction ? ethClient.eth.sendSignedTransaction(c.rawTransaction) : undefined)
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

main()
