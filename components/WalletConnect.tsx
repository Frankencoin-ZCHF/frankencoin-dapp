import { useEffect } from "react";
import { useIsWrongNetwork } from "@hooks";

export default function WalletConnect() {
  const isWrongNetwork = useIsWrongNetwork();

  useEffect(() => {
    console.log(isWrongNetwork);
    try {
      const networkButtons =
        document.getElementsByTagName("w3m-network-button");
      if (!networkButtons || networkButtons.length == 0) return;

      const wuiButton = networkButtons.item(0)?.shadowRoot?.children.item(0);
      if (!wuiButton) return;

      wuiButton.innerHTML = "Wrong Network";
    } catch {}
  }, [isWrongNetwork]);

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end sm:flex-row sm:items-center gap-2 font-bold">
        <div className={isWrongNetwork ? "" : "hidden"}>
          <w3m-network-button />
        </div>
        <w3m-button />
      </div>
    </div>
  );
}
