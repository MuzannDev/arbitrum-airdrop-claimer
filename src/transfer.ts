import { PromiEvent, TransactionReceipt } from 'web3-core'
import secrets from '../secrets.json'
import { getNonce, l2Client, token } from './utils'
import { DISTRIBUTOR_ADDRESS, TOKEN_ADDRESS, gasPrice } from '.'

const retryCount:number[] = Array(secrets.length).fill(0)

function startTransferEventListener(tx: PromiEvent<TransactionReceipt> | undefined, index: number){
    tx?.on('transactionHash', txhash => {
        console.log(`Account ${index}: Transfer tx sent > ${txhash}`)
    })
    tx?.on('confirmation', confirmationNumber  => {
        if (confirmationNumber == 1) console.log(`Account ${index}: Tokens transfered`)
    })
    tx?.on('error', async () => {
        if (retryCount[index] >= 3){
            console.log(`Account ${index}: Too many errors, aborting`)
            return
        }
        retryCount[index]++
        console.log(`Account ${index}: Tx #${retryCount[index]} error > Retry`)
        transferTokens(secrets[index], index)
    })
}

export async function transferTokens(privateKey: string, index: number){
    const balanceQuery = token.methods.balanceOf(l2Client.eth.accounts.privateKeyToAccount(privateKey).address).call()
    const nonceQuery = getNonce(privateKey)
    const queryResponse = await Promise.all([balanceQuery, nonceQuery])
    const transferData = token.methods.transfer(process.env.BANK_ADDRESS, queryResponse[0])
    const signedTx = await l2Client.eth.accounts.signTransaction({
        to: TOKEN_ADDRESS,
        data: transferData.encodeABI(),
        nonce: queryResponse[1],
        gasPrice,
        gas: '1000000'
    }, privateKey) 
    if (!signedTx.rawTransaction) return
    const tx = l2Client.eth.sendSignedTransaction(signedTx.rawTransaction)
    startTransferEventListener(tx, index)
}

