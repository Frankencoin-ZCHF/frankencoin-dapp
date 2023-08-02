import AppButton from "./AppButton";
import Link from "next/link";
import WalletConnect from "./WalletConnect";

export default function Navbar() {

  return (
    <div className="mx-auto max-w-6xl 2xl:max-w-7xl">
      <header className="flex items-center py-2 sm:gap-x-4 md:py-4">
        <AppButton className="-mr-3 md:-mr-4 md:hidden" icon="/icons/menu.svg" />

        <Link className="" href="/">
          <picture>
            <img className="h-9 transition" src="/assets/logoSquare.svg" alt="Logo" />
          </picture>
        </Link>

        <ul className="justify-left hidden flex-1 gap-2 md:flex lg:gap-3 xl:w-1/2">
          <li>
            <AppButton className="btn btn-nav" to="/swap">Swap</AppButton>
          </li>

          <li>
            <AppButton className="btn btn-nav" to="/positions">Positions</AppButton>
          </li>

          <li>
            <AppButton className="btn btn-nav" to="/pool">Reserve Pool</AppButton>
          </li>

          <li>
            <AppButton className="btn btn-nav" to="/auctions">Auctions</AppButton>
          </li>
        </ul>
        <div className="flex flex-1 justify-end">
          <WalletConnect />
        </div>
      </header>
    </div>
  );
}
