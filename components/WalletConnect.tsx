import { useEffect } from "react";
import { useIsWrongNetwork } from "@hooks";
import { useWeb3Modal } from "@web3modal/wagmi/react";

export default function WalletConnect() {
  const { open } = useWeb3Modal();
  const isWrongNetwork = useIsWrongNetwork();

  useEffect(() => {
    console.log(`Is Ethereum Mainnet: ${!isWrongNetwork}`);
    if (!isWrongNetwork) return;
    else open({ view: "Networks" });
  }, [isWrongNetwork]);

  return (
    // removed: flex-col items-end sm:flex-row sm:
    <div className="flex sm:flex-row items-center gap-4">
      <div className="flex items-center gap-2 font-bold">
        <w3m-network-button disabled={isWrongNetwork} />
        <w3m-button />
      </div>
    </div>
  );
}