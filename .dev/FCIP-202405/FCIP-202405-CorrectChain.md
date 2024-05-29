## FCIP-202405-CorrectChain.md

### Github refs

https://github.com/Frankencoin-ZCHF/frankencoin-dapp/issues/25
https://github.com/Frankencoin-ZCHF/frankencoin-dapp/pull/35

### Changes requested

-   app.frankencoin.com always connects to mainnet, github main branch
-   devapp.frankencoin.com that can connect to Sepolia or Mainnet, github dev branch

### Changes in codebase requested (if possible)

-   If wallet is connected to unsupported chain, disconnect wallet **silently**
-   If user tries to interact with the blockchain while not connected, prompt for connection.
-   Avoid modular, prompt, pop ups, ...

### Changes might affect component or file

-   Button actions, restict interaction if wrong network
-   Click to action? Request change in network to WalletConnect
-   Files?
    -   Swap, Swap button
    -   Position/create, Button
    -   Position/borrow, Button
    -   Position/adjust, Button
    -   Position/challange, Button
    -   Position/bid, Button
    -   Equity, Button
    -   Governance, Button

## Added

-   @hooks: useWalletConnectStats.ts
    -   useIsConnectedToCorrectChain: check if wallet is connected and if its connected to one of the available chains
-   @components: GuardToAllowedChainBtn.tsx: Guard wrapper for button
