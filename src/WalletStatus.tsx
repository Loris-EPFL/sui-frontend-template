import { useCurrentAccount } from "@mysten/dapp-kit";
import { Container, Flex, Heading, Text } from "@radix-ui/themes";
import { OwnedObjects } from "./OwnedObjects";
import { AuthService } from './utils/authService';
import { SuiService } from './utils/suiService';
import { useState } from "react";
import { useEffect } from "react";
import { useCallback } from "react";

export function WalletStatus() {
  const account = useCurrentAccount();

  let walletAddress;
  //const suiService = new SuiService();

  /*

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
