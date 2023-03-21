import { DISTRIBUTOR_ADDRESS, gasPrice } from "."
import { distributor, getNonce, l2Client } from "./utils"
import { SignedTransaction, PromiEvent, TransactionReceipt } from 'web3-core'
import secrets from '../secrets.json'
import { transferTokens } from "./transfer"

const retryCount:number[] = Array(secrets.length).fill(0)

async function createSignedClaim(privateKey: string){
    const claimData = distributor.methods.claim() 
    const nonce = await getNonce(privateKey)
    return await l2Client.eth.accounts.signTransaction({
        to: DISTRIBUTOR_ADDRESS,
        data: claimData.encodeABI(),
        nonce,
        gasPrice,
        gas: '1000000'
    }, privateKey) 
}

function claim(signedTx:SignedTransaction){
    if (!signedTx.rawTransaction) return
    return l2Client.eth.sendSignedTransaction(signedTx.rawTransaction)
}

function startClaimEventListener(tx: PromiEvent<TransactionReceipt> | undefined, index: number){
    tx?.on('transactionHash', txhash => {
        console.log(`Account ${index}: Claim tx sent > ${txhash}`)
    })
    tx?.on('confirmation', confirmationNumber  => {
        if (confirmationNumber == 1) {
            console.log(`Account ${index}: Airdrop claimed`)
            transferTokens(secrets[index], index)
        }
    })
    tx?.on('error', async () => {
        if (retryCount[index] >= 3){
            console.log(`Account ${index}: Too many errors, aborting`)
            return
        }
        retryCount[index]++
        console.log(`Account ${index}: Tx #${retryCount[index]} error > Retry`)
        const signedTx = await createSignedClaim(secrets[index])
        const tx = claim(signedTx)
        startClaimEventListener(tx, index)
    })
}

export async function handleClaims(signedClaims: SignedTransaction[]){
    let sendClaims = signedClaims.map(c => c.rawTransaction ? l2Client.eth.sendSignedTransaction(c.rawTransaction) : undefined)
    sendClaims.forEach((tx, index) => startClaimEventListener(sendClaims[index], index))
}

export async function prepareClaims(distributorAddress: string){
    // encode & sign tx
    let signedQuery = secrets.map(privateKey => createSignedClaim(privateKey))
    return await Promise.all(signedQuery)
}