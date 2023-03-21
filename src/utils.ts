import Web3 from 'web3'
import BLOCK_ABI from './abi/block.json'
import dotenv from 'dotenv'
import { AbiItem } from 'web3-utils'
import DISTRIBUTOR_ABI from './abi/distributor.json'
import { SignedTransaction } from 'web3-core'
import ERC20_ABI from './abi/erc20.json'
import secrets from '../secrets.json'

dotenv.config()

export const l2Client = new Web3(process.env.L2_RPC_URL ? process.env.L2_RPC_URL : process.exit(1))
const blockContract = new l2Client.eth.Contract(BLOCK_ABI as AbiItem[], process.env.BLOCK_CONTRACT_ADDRESS)
export const distributor = new l2Client.eth.Contract(DISTRIBUTOR_ABI as AbiItem[], process.env.DISTRIBUTOR_NORMAL_ADDRESS)
export const distributorTest = new l2Client.eth.Contract(DISTRIBUTOR_ABI as AbiItem[], process.env.DISTRIBUTOR_TEST_ADDRESS)
export const token = new l2Client.eth.Contract(ERC20_ABI as AbiItem[], process.env.TOKEN_NORMAL_ADDRESS)

export function handleError(message: string){
    console.log(message)
    process.exit(1)
    return <any>{}
}

export async function getCurrentL1Block(){
    return await blockContract.methods.getL1Block().call()
}


export async function getNonce(privateKey: string){
    const address = l2Client.eth.accounts.privateKeyToAccount(privateKey)
    const nonce = await l2Client.eth.getTransactionCount(address.address)
    return nonce
}

export async function beforeTest(){
    return new Promise(async (resolve, _) => {
        console.log('Setting airdrop recipients on test contract..')
        // Add all the privatekey as airdrop recipients on test contract
        const recipients = secrets.map(privateKey => l2Client.eth.accounts.privateKeyToAccount(privateKey).address)
        const setRecipientData = await distributorTest.methods.setRecipients(
            recipients,
            new Array(recipients.length).fill('100')
        ) 
        const nonce = await l2Client.eth.getTransactionCount(recipients[0])
        const gasPrice = await l2Client.eth.getGasPrice()
        const signedQuery = await l2Client.eth.accounts.signTransaction({
            to: process.env.DISTRIBUTOR_TEST_ADDRESS,
            data: setRecipientData.encodeABI(),
            nonce,
            gasPrice,
            gas: '1000000'
        }, secrets[0])
        if (!signedQuery.rawTransaction){
            console.log('An unknown error happened, please try again')
            process.exit(1)
        }
        const setRecipientTx = l2Client.eth.sendSignedTransaction(signedQuery.rawTransaction)
        setRecipientTx.on('confirmation', (confirmationNumber) => {
            if (confirmationNumber === 1){
                console.log('Succesfully added airdrop recipients')
                resolve(true)
            }
        })
        // recipient already set error supposed to happen if retry
        setRecipientTx.on('error', () => resolve(true))
        setTimeout(() => {
            console.log('An unknown error happened, please try again')
            process.exit(1)
        }, 15000)
    })
}
