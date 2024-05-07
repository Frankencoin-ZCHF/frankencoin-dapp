import { useEffect } from "react";
import { useIsEthereumMainnet } from "@hooks";
import { useWeb3Modal } from "@web3modal/wagmi/react";

export default function WalletConnect() {
  const { open } = useWeb3Modal();
  const isEthereumMainnet = useIsEthereumMainnet();

  useEffect(() => {
    console.log(`Is Ethereum Mainnet: ${isEthereumMainnet}`);
    if (isEthereumMainnet) return;
    else open({ view: "Networks" });
  }, [isEthereumMainnet, open]);

  return (
    // removed: flex-col items-end sm:flex-row sm:
    <div className="flex sm:flex-row items-center gap-4">
      <div className="flex items-center gap-2 font-bold">
        <w3m-network-button disabled={isEthereumMainnet ? true : undefined} />
        <w3m-button />
      </div>
    </div>
  );
}