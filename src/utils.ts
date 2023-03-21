import Web3 from 'web3'
import BLOCK_ABI from './abi/block.json'
import dotenv from 'dotenv'
import { AbiItem } from 'web3-utils'
import DISTRIBUTOR_ABI from './abi/distributor.json'
import { SignedTransaction } from 'web3-core'

dotenv.config()

export const l2Client = new Web3(process.env.L2_RPC_URL ? process.env.L2_RPC_URL : process.exit(1))
const blockContract = new l2Client.eth.Contract(BLOCK_ABI as AbiItem[], process.env.BLOCK_CONTRACT_ADDRESS)
export const distributor = new l2Client.eth.Contract(DISTRIBUTOR_ABI as AbiItem[], process.env.DISTRIBUTOR_NORMAL_ADDRESS)
export const distributorTest = new l2Client.eth.Contract(DISTRIBUTOR_ABI as AbiItem[], process.env.DISTRIBUTOR_TEST_ADDRESS)

export function handleError(message: string){
    console.log(message)
    process.exit(1)
    return <any>{}
}

export async function getCurrentL1Block(){
    return await blockContract.methods.getL1Block().call()
}