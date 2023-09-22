import Head from "next/head";
import AppBox from "../components/AppBox";
import DisplayLabel from "../components/DisplayLabel";
import DisplayAmount from "../components/DisplayAmount";
import { useHomeStats } from "../hooks";
import Link from "next/link";
import { useContractUrl } from "../hooks/useContractUrl";
import { ADDRESS } from "../contracts/address";
import { useChainId } from "wagmi";
import { shortenAddress } from "../utils";
import AppPageHeader from "../components/AppPageHeader";

export default function Home() {
  const chainId = useChainId();
  const homestats = useHomeStats();
  const frankenLink = useContractUrl(ADDRESS[chainId].frankenCoin);

  return (
    <>
      <Head>
        <title>FrankenCoin - Home</title>
      </Head>
      <main className="block">
        <section className="mt-16 grid items-center gap-20 align-middle lg:grid-cols-5">
          <div className="lg:col-span-3">
            <h1 className="mb-12 text-right text-4xl font-bold">
              <picture>
                <img src="/assets/logo.svg" alt="logo" />
              </picture>
            </h1>

            <p className="text-lg font-bold">
              The Frankencoin is a collateralized, oracle-free stablecoin that
              tracks the value of the Swiss franc. You are looking at a frontend
              to an early access version deployed to&nbsp;
              <a
                href="https://etherscan.io/address/0xB50808dEa4Dd28A336D69f4b70AA13c97364B3Fb#code"
                target="_blank"
                rel="noreferrer"
              >
                the Ethereum mainnet
              </a>
              .
            </p>
            <p>
              This is an alpha version that contains several critical flaws, as
              uncovered in a recent&nbsp;
              <a
                href="https://code4rena.com/reports/2023-04-frankencoin"
                target="_blank"
                rel="noreferrer"
              >
                audit competition
              </a>
              . As the number of uncovered flaws is higher than anticipated, we
              are likely to perform another audit soon.
            </p>
            <p>
              Unlike the minting mechanisms of other collateralized stablecoins,
              Frankencoin&apos;s auction-based mechanism does not depend on
              external oracles. It is very flexible with regards to the used
              collateral. In principle, it supports any collateral with
              sufficient availability on the market. However, its liquidation
              mechanism is slower than that of other collaterlized stablecoins,
              making it less suitable for highly volatile types of collateral.
              The name is inspired by the system&apos;s self-governing nature.
            </p>
          </div>

          <div className="lg:col-span-2">
            <picture>
              <img
                className="m-auto max-w-lg"
                src="/assets/logoSquare.svg"
                alt="logo"
              />
            </picture>
          </div>
        </section>
        <section className="m-auto flex flex-col gap-2">
          <hr className="my-12" />

          <h2 className="text-2xl font-bold">Frankencoin Token</h2>
          <p>
            Frankencoin is a freely transferrable stablecoin that follows the
            ERC-20 standard. It can be minted by anyone who provides the
            necessary collateral. Its peg to the Swiss franc is not technically
            enforced, but relies on the economics of the system. In essence, the
            system is most valuable when the Frankencoin tracks the value of the
            Swiss franc, so those who benefit from the system being valuable
            have an incentive to make that happen. Those who benefit are the
            holders of Frankencoin Pool Shares (FPS).
          </p>

          <div className="grid gap-1 lg:grid-cols-3">
            <div className="grid grid-cols-6 gap-1 lg:col-span-2">
              <AppBox className="col-span-6 sm:col-span-3">
                <DisplayLabel label="Supply">
                  <DisplayAmount
                    amount={homestats.frankenTotalSupply}
                    currency={homestats.frankenSymbol}
                    digits={18}
                    big
                  />
                </DisplayLabel>
              </AppBox>
              <AppBox className="col-span-6 sm:col-span-3">
                <DisplayLabel label="Your ZCHF">
                  <DisplayAmount
                    amount={homestats.frankenBalance}
                    currency={homestats.frankenSymbol}
                    digits={18}
                  />
                </DisplayLabel>
              </AppBox>
              <AppBox className="col-span-3 sm:col-span-2">
                <DisplayLabel label="Equity">
                  <DisplayAmount
                    amount={homestats.frankenEquity}
                    currency={homestats.frankenSymbol}
                    digits={18}
                  />
                </DisplayLabel>
              </AppBox>
              <AppBox className="col-span-3 sm:col-span-2">
                <DisplayLabel label="Swap pool">
                  <DisplayAmount
                    amount={homestats.xchfBridgeBal}
                    currency={homestats.xchfSymbol}
                    digits={18}
                  />
                </DisplayLabel>
              </AppBox>
              <AppBox className="col-span-3 sm:col-span-2">
                <DisplayLabel label="Minter Reserve">
                  <DisplayAmount
                    amount={homestats.frankenMinterReserve}
                    currency={homestats.frankenSymbol}
                    digits={18}
                  />
                </DisplayLabel>
              </AppBox>
            </div>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex flex-col gap-2">
                <h3 className="font-bold">Inspect contract</h3>
                <Link
                  className="btn btn-secondary px-3 py-2"
                  href={frankenLink}
                  target="_blank"
                >
                  {shortenAddress(ADDRESS[chainId].frankenCoin)}
                </Link>
              </div>
            </div>
          </div>

          <hr className="my-12" />

          <h2 className="text-2xl font-bold">Reserve Pool Shares</h2>
          <p>
            The Frankencoin system receives income in the form of fees, and it
            can incur losses in case a collateral proved to be insufficient.
            These go into a reserve pool. If the Frankencoin system was a
            company, this reserve pool would be called
            <em>equity</em>. It accumulates profits and absorbs losses. Anyone
            can contribute to the reserve pool, thereby getting freshly minted
            Frankencoin Pool Share (FPS) tokens. Anyone who held onto their FPS
            tokens for long enough, namely at least 90 days, can also redeem
            them again against Frankencoins from the reserve pool at any time.
            If the Frankencoin&apos;s equity has grown in the meantime, you will
            make a profit (and a loss if it declined). Essentially, this is a
            system of continuous issuance and redemption inspired by the idea of
            the&nbsp;
            <a
              href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4189472"
              target="_blank"
              rel="noreferrer"
            >
              Continuous Capital Corporation
            </a>
            . Holders of reserve pool shares enjoy veto power for new minting
            mechanisms as long as they have at least 3% of the time-weighted
            outstanding shares.
          </p>

          <div className="grid gap-1 lg:grid-cols-3">
            <div className="grid gap-1 sm:grid-cols-2 lg:col-span-2">
              <AppBox>
                <DisplayLabel label="Price">
                  <DisplayAmount
                    amount={homestats.equityPrice}
                    currency={homestats.frankenSymbol}
                    big
                  />
                </DisplayLabel>
              </AppBox>
              <AppBox>
                <DisplayLabel label="Market Cap">
                  <DisplayAmount
                    amount={homestats.equityMarketCap}
                    currency={homestats.frankenSymbol}
                    big
                  />
                </DisplayLabel>
              </AppBox>
              <AppBox>
                <DisplayLabel label="Total Supply">
                  <DisplayAmount
                    amount={homestats.equityTotalSupply}
                    currency="FPS"
                    big
                  />
                </DisplayLabel>
              </AppBox>
              <AppBox>
                <DisplayLabel label="Your Balance">
                  <DisplayAmount
                    amount={homestats.equityBalance}
                    currency="FPS"
                    big
                  />
                </DisplayLabel>
              </AppBox>
              <AppBox>
                <DisplayLabel label="Total Votes">
                  <DisplayAmount
                    amount={homestats.equityTotalVotes}
                    digits={24}
                    big
                  />
                </DisplayLabel>
              </AppBox>
              <AppBox>
                <DisplayLabel label="Your Votes">
                  <DisplayAmount
                    amount={homestats.equityUserVotes}
                    digits={24}
                    big
                  />
                </DisplayLabel>
              </AppBox>
            </div>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex flex-col gap-2">
                <h3 className="font-bold">Inspect contract</h3>
                <Link
                  className="btn btn-secondary px-3 py-2"
                  href={frankenLink}
                  target="_blank"
                >
                  {shortenAddress(ADDRESS[chainId].equity)}
                </Link>
              </div>
            </div>
          </div>

          <hr className="my-12" />
          <h2 className="text-2xl font-bold">Stablecoin Conversion</h2>
          <p>
            Bridge contracts allow to convert other Swiss Franc stablecoins 1:1
            into Frankencoins and also back again as long as there are some
            left. The deposited stablecoins are kept in the bridge until another
            user wants to convert ZCHF back into the resprective stablecoin. For
            now, the only bridge is the one to the&nbsp;
            <a
              href="https://www.bitcoinsuisse.com/cryptofranc"
              target="_blank"
              rel="noreferrer"
            >
              Crypto Franc (XCHF)
            </a>
            .
          </p>

          <Link href="/swap">
            <h3 className="text-xl font-bold">CryptoFranc (XCHF)</h3>
          </Link>

          <div className="grid gap-1 lg:grid-cols-3">
            <div className="grid gap-1 sm:grid-cols-2 lg:col-span-2">
              <AppBox>
                <DisplayLabel label="Bridge Balance">
                  <DisplayAmount
                    amount={homestats.xchfBridgeBal}
                    currency={homestats.xchfSymbol}
                    big
                  />
                </DisplayLabel>
              </AppBox>

              <AppBox>
                <DisplayLabel label="Your Balance">
                  <DisplayAmount
                    amount={homestats.xchfUserBal}
                    currency={homestats.xchfSymbol}
                    big
                  />
                </DisplayLabel>
              </AppBox>
            </div>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex flex-col gap-2">
                <h3 className="font-bold">Inspect contract</h3>
                <Link
                  className="btn btn-secondary px-3 py-2"
                  href={frankenLink}
                  target="_blank"
                >
                  {shortenAddress(ADDRESS[chainId].bridge)}
                </Link>
              </div>
            </div>
          </div>

          <hr className="my-12" />

          <h2 className="text-2xl font-bold">Collateralized Positions</h2>
          <p>
            Collateralized minting positions allow their owner to mint ZCHF
            against a collateral. Anyone can open new collateral positions and
            start minting ZCHF once the initialization period has passed.
            Positions that are not sufficiently collateralized can be challenged
            by anyone through an auction mechanism. When challenging a position,
            the challenger must provide some of the collateral to be auctioned
            off. If the highest bid in the subsequent auction is high enough to
            show that the position is sufficiently collateralized, the challenge
            is averted and the bidder gets the challengers collateral in
            exchange for the highest bid. If the highest bid is lower, the
            challenge is considered successful, the bidder gets the collateral
            from the position and the position is closed, distributing excess
            proceeds to the reserve and paying a reward to the challenger.
          </p>

          <div className="mx-auto my-8 flex w-auto flex-col items-center justify-center">
            <AppPageHeader title="Minting Hub" />
            <Link
              className="btn btn-secondary px-3 py-2"
              href={frankenLink}
              target="_blank"
            >
              {shortenAddress(ADDRESS[chainId].mintingHub)}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
