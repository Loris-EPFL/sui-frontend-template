import { useCurrentAccount } from "@mysten/dapp-kit";
import { Container, Flex, Heading, Text } from "@radix-ui/themes";
import { OwnedObjects } from "./OwnedObjects";
import { AuthService } from './utils/authService';
import { SuiService } from './utils/suiService';
import { useEffect, useRef, useState, useCallback } from 'react';
import { AccountData } from './components/zkLogin';


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

  

  return (
    <Container my="2">
      <Heading mb="2">Wallet Status</Heading>

      {account ? (
        <Flex direction="column">
          <Text>Wallet connected</Text>
          <Text>Address: {account.address}</Text>
        </Flex>
      ) : (
        <Text>Wallet not connected</Text>
      )}
      <OwnedObjects />
    </Container>
  );
}
