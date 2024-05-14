import { useCurrentAccount } from "@mysten/dapp-kit";
import { Container, Flex, Heading, Text } from "@radix-ui/themes";
import { OwnedObjects } from "./OwnedObjects";
import { AuthService } from './utils/authService';
import { SuiService } from './utils/suiService';
import { useEffect, useRef, useState, useCallback } from 'react';
import { AccountData } from './components/zkLogin';
import { NetworkName, makeExplorerUrl, requestSuiFromFaucet, shortenSuiAddress } from '@polymedia/suits';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { SerializedSignature, decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import {
  genAddressSeed,
  generateNonce,
  generateRandomness,
  getExtendedEphemeralPublicKey,
  getZkLoginSignature,
  jwtToAddress,
} from '@mysten/zklogin';


const NETWORK: NetworkName = 'devnet';


const suiClient = new SuiClient({
  url: getFullnodeUrl(NETWORK),
});


export function WalletStatus() {
  const account = useCurrentAccount();
  

  let walletAddress;

  const setupDataKey = 'zklogin-demo.setup';
  const accountDataKey = 'zklogin-demo.accounts';

  function loadAccounts(): AccountData[] {
    const dataRaw = localStorage.getItem(accountDataKey);
    if (!dataRaw) {
        return [];
    }
    const data: AccountData[] = JSON.parse(dataRaw);
    return data;
}

async function fetchBalances(accounts: AccountData[]) {
  if (accounts.length == 0) {
      return;
  }
  const newBalances = new Map<string, number>();
  for (const account of accounts) {
      const suiBalance = await suiClient.getBalance({
          owner: account.userAddr,
          coinType: '0x2::sui::SUI',
      });
      newBalances.set(
          account.userAddr,
          +suiBalance.totalBalance/1_000_000_000
      );
  }
  setBalances(prevBalances =>
      new Map([...prevBalances, ...newBalances])
  );
}

  

  const accounts = useRef<AccountData[]>(loadAccounts()); // useRef() instead of useState() because of setInterval()
  const [balances, setBalances] = useState<Map<string, number>>(new Map()); // Map<Sui address, SUI balance>

  /*
  //Local storage keys

  const setupDataKey = 'zklogin-demo.setup';
  const accountDataKey = 'zklogin-demo.accounts';

  
  
  const getBalance = useCallback(async () => {
    try {
      if (AuthService.isAuthenticated()) {
        setBalance(await suiService.getFormattedBalance(AuthService.walletAddress()));
      }
    } catch (error) {
      console.log({ error });
    } finally {
    }
  });

  const logout = async () => {
    sessionStorage.clear();

    window.location.href = '/';
  };

  */
  /**
     * Create a keypair from a base64-encoded secret key
     */
  function keypairFromSecretKey(privateKeyBase64: string): Ed25519Keypair {
    const keyPair = decodeSuiPrivateKey(privateKeyBase64);
    return Ed25519Keypair.fromSecretKey(keyPair.secretKey);
}

  async function sendTransaction(account: AccountData) {

    // Sign the transaction bytes with the ephemeral private key
    const txb = new TransactionBlock();
    txb.setSender(account.userAddr);

    const ephemeralKeyPair = keypairFromSecretKey(account.ephemeralPrivateKey);
    const { bytes, signature: userSignature } = await txb.sign({
        client: suiClient,
        signer: ephemeralKeyPair,
    });

    // Generate an address seed by combining userSalt, sub (subject ID), and aud (audience)
    const addressSeed = genAddressSeed(
        BigInt(account.userSalt),
        'sub',
        account.sub,
        account.aud,
    ).toString();

    // Serialize the zkLogin signature by combining the ZK proof (inputs), the maxEpoch,
    // and the ephemeral signature (userSignature)
    const zkLoginSignature : SerializedSignature = getZkLoginSignature({
        inputs: {
            ...account.zkProofs,
            addressSeed,
        },
        maxEpoch: account.maxEpoch,
        userSignature,
    });

    // Execute the transaction
    await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature: zkLoginSignature,
        options: {
            showEffects: true,
        },
    })
    .then(result => {
        console.debug('[sendTransaction] executeTransactionBlock response:', result);
        fetchBalances([account]);
    })
    .catch((error: unknown) => {
        console.warn('[sendTransaction] executeTransactionBlock failed:', error);
        return null;
    });
}

  

  return (
    <Container my="2">
      <Heading mb="2">Wallet Status</Heading>
      { accounts.current.length > 0 &&
      <div>
        {accounts.current.map(acct => {
                  const balance = balances.get(acct.userAddr);
                  const explorerLink = makeExplorerUrl(NETWORK, 'address', acct.userAddr);
                  console.log(accounts.current)
                  return (
                  <div className='account' key={acct.userAddr}>
                      <div>
                          <label className={`provider ${acct.provider}`}>{acct.provider}</label>
                      </div>
                      <div>
                          Address: <a target='_blank' rel='noopener noreferrer' href={explorerLink}>
                              {shortenSuiAddress(acct.userAddr, 6, 6, '0x', '...')}
                          </a>
                      </div>
                      <div>User ID: {acct.sub}</div>
                      <div>Balance: {typeof balance === 'undefined' ? '(loading)' : `${balance} SUI`}</div>
                      <button
                          className={`btn-send ${!balance ? 'disabled' : ''}`}
                          disabled={!balance}
                          onClick={() => {sendTransaction(acct)}}
                      >
                          Send transaction
                      </button>
                      { balance === 0 &&
                          <button
                              className='btn-faucet'
                              onClick={() => {
                                  requestSuiFromFaucet(NETWORK, acct.userAddr);
                              }}
                          >
                              Use faucet
                          </button>
                      }
                      <hr/>
                  </div>
                  );
              })}
      </div>
}
      <div>
      {account ? (
        <Flex direction="column">
          <Text>Wallet connected</Text>
          <Text>Address: {account.address}</Text>
        </Flex>
      ) : (
        <Text>Wallet not connected</Text>
      )}
      </div>
      <OwnedObjects />
    </Container>
  );
}
