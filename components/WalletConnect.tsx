import { Web3Button, Web3NetworkSwitch } from "@web3modal/react";

export default function WalletConnect() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 font-bold">
        <Web3NetworkSwitch />
        <Web3Button icon="show" label="Connect Wallet" balance="show" />
      </div>
    </div>
  )
}