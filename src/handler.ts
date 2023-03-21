import { distributor, distributorTest, l2Client } from "./utils"
import { PromiEvent, SignedTransaction, TransactionReceipt } from 'web3-core'
import secrets from '../secrets.json'
import { DISTRIBUTOR_ADDRESS } from "."

let gasPrice:string
let claimData:any
const retryCount:number[] = Array(secrets.length).fill(0)

export async function createSignedTx(privateKey: string){
    claimData = distributor.methods.claim() 
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

function startTxEventListener(tx: PromiEvent<TransactionReceipt> | undefined, index: number){
    tx?.on('transactionHash', txhash => {
        console.log(`Account ${index}: Tx sent > ${txhash}`)
    })
    tx?.on('confirmation', confirmationNumber  => {
        if (confirmationNumber == 1) console.log(`Account ${index}: Airdrop claimed`)
    })
    tx?.on('error', async () => {
        if (retryCount[index] >= 3){
            console.log(`Account ${index}: Too many errors, aborting`)
            return
        }
        retryCount[index]++
        console.log(`Account ${index}: Tx #${retryCount[index]} error > Retry`)
        const signedTx = await createSignedTx(secrets[index])
        const tx = claim(signedTx)
        startTxEventListener(tx, index)
    })
}

export async function handleClaims(signedClaims: SignedTransaction[]){
    let sendClaims = signedClaims.map(c => c.rawTransaction ? l2Client.eth.sendSignedTransaction(c.rawTransaction) : undefined)
    sendClaims.forEach((tx, index) => startTxEventListener(sendClaims[index], index))
}

export async function prepareTxs(distributorAddress: string){
    gasPrice = (parseInt(await l2Client.eth.getGasPrice()) * 2).toString()
    // generate calldata for claim
    claimData = distributor.methods.claim()    
    const allNonces:number[] = []
    // encode & sign tx
    let signedQuery = secrets.map(privateKey => createSignedTx(privateKey))
    return await Promise.all(signedQuery)
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

async function getNonce(privateKey: string){
    const address = l2Client.eth.accounts.privateKeyToAccount(privateKey)
    const nonce = await l2Client.eth.getTransactionCount(address.address)
    return nonce
}