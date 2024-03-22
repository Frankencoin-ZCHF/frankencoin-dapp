import Head from "next/head";
import AppBox from "@components/AppBox";
import DisplayLabel from "@components/DisplayLabel";
import DisplayAmount from "@components/DisplayAmount";
import {
  useHomeStats,
  useContractUrl,
  useTvl,
  usePositionLists,
  useChallengeCount,
} from "@hooks";
import Link from "next/link";
import { ADDRESS } from "@contracts";
import { useChainId } from "wagmi";
import { SOCIAL, formatBigInt, shortenAddress } from "../utils";
import AppPageHeader from "../components/AppPageHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { parseUnits } from "viem";
import { polygon, mainnet, arbitrum, optimism } from "viem/chains";
import TokenLogo from "@components/TokenLogo";

export default function Home() {
  const chainId = useChainId();
  const homestats = useHomeStats();
  const frankenLinkEth = useContractUrl(ADDRESS[chainId].frankenCoin);
  const frankenLinkPolygon = useContractUrl(
    ADDRESS[polygon.id].frankenCoin,
    polygon
  );
  const frankenLinkArb = useContractUrl(
    ADDRESS[arbitrum.id].frankenCoin,
    polygon
  );
  const frankenLinkOp = useContractUrl(
    ADDRESS[optimism.id].frankenCoin,
    optimism
  );
  const tvlData = useTvl<number>();
  const positionData = usePositionLists();
  const challengeCount = useChallengeCount();

  return (
    <>
      <Head>
        <title>Frankencoin - App</title>
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
              Frankencoin is a collateralized, oracle-free stablecoin that
              tracks the value of the Swiss franc. Its strengths are its
              decentralization and its versatility.
            </p>
            <p>
              Unlike other collateralized stablecoins,&nbsp;
              <a
                href="https://etherscan.io/address/0xB58E61C3098d85632Df34EecfB899A1Ed80921cB"
                target="_blank"
              >
                Frankencoin&apos;s
              </a>{" "}
              auction-based liquidation mechanism does not depend on external
              price sources. It is very flexible with regards to the used
              collateral. In principle, it supports any collateral with
              sufficient availability on the market. However, its liquidation
              mechanism is slower than that of other collateralized stablecoins,
              making it less suitable for highly volatile types of collateral.
            </p>
            <p>
              The frontend you are looking at provides access to five basic
              functions of the Frankencoin system. Advanced functions, such as
              proposing new types of collateral or vetoing proposals must at
              this point in time be performed manually. The{" "}
              <a href={SOCIAL.Github_dapp} target="_blank">
                source code of this website
              </a>{" "}
              is openly available and can be freely copied and modified, just
              like the underlying{" "}
              <a href={SOCIAL.Github_contract} target="_blank">
                smart contracts
              </a>
              . The smart contracts have been audited by&nbsp;
              <a href={SOCIAL.Audit_Blockbite} target="_blank">
                Blockbite
              </a>
              ,&nbsp;
              <a href={SOCIAL.Audit_Code4rena} target="_blank">
                Code4rena
              </a>
              , and&nbsp;
              <a href={SOCIAL.Audit_Chainsecurity} target="_blank">
                ChainSecurity
              </a>
              . Its economic properties have been analyzed as part of a{" "}
              <a href="thesis-preprint-frankencoin.pdf">pending phd thesis</a>.
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
        <div className="mt-16 bg-slate-950 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-4 p-4">
          <AppBox className="col-span-6 sm:col-span-4">
            <a href={SOCIAL.DefiLlama} target="_blank">
              <DisplayLabel label="Total Value Locked" className="underline" />
            </a>
            <div className="mt-2 text-right">
              {formatBigInt(
                parseUnits(tvlData.data?.toString() || "0", 18),
                18,
                0
              )}{" "}
              USD
            </div>
          </AppBox>
          <AppBox className="col-span-6 sm:col-span-4">
            <Link href={"/positions"}>
              <DisplayLabel label="Active Positions" className="underline" />
            </Link>
            <div className="mt-2 text-right">
              {
                positionData.positions.filter(
                  (position) => !position.denied && !position.closed
                ).length
              }
            </div>
          </AppBox>
          <AppBox className="col-span-6 sm:col-span-4">
            <Link href={"/auctions"}>
              <DisplayLabel label="Active Challenges" className="underline" />
            </Link>
            <div className="mt-2 text-right">{challengeCount}</div>
          </AppBox>
          <AppBox className="col-span-6 sm:col-span-4">
            <DisplayLabel label="Total Supply">
              <DisplayAmount
                amount={homestats.frankenTotalSupply}
                currency={homestats.frankenSymbol}
                digits={18}
                className="justify-end"
              />
            </DisplayLabel>
          </AppBox>
          <AppBox className="col-span-6 sm:col-span-4">
            <DisplayLabel label="FPS Market Cap">
              <DisplayAmount
                amount={homestats.equityMarketCap}
                currency={homestats.frankenSymbol}
                digits={18}
                className="justify-end"
              />
            </DisplayLabel>
          </AppBox>
          <AppBox className="col-span-6 sm:col-span-4">
            <DisplayLabel label="Your Balance">
              <DisplayAmount
                amount={homestats.frankenBalance}
                currency={homestats.frankenSymbol}
                digits={18}
                className="justify-end"
              />
            </DisplayLabel>
          </AppBox>
          <AppBox className="col-span-6 sm:col-span-3">
            <DisplayLabel label="Mainnet Deployment" />
            <div className="flex items-center py-2 justify-end">
              <TokenLogo currency="ZCHF" chain="mainnet" />
              <div className="flex flex-col text-right">
                <Link
                  className="underline"
                  href={frankenLinkEth}
                  target="_blank"
                >
                  Frankencoin Contract
                </Link>
                <Link
                  href={
                    "https://app.uniswap.org/swap?inputCurrency=0xdAC17F958D2ee523a2206206994597C13D831ec7&outputCurrency=0xB58E61C3098d85632Df34EecfB899A1Ed80921cB&chain=mainnet"
                  }
                  target="_blank"
                  className="underline text-sm text-slate-500"
                >
                  Uniswap Pool
                </Link>
              </div>
            </div>
          </AppBox>
          <AppBox className="col-span-6 sm:col-span-3">
            <DisplayLabel label="Polygon PoS Bridge" />
            <div className="flex items-center py-2 justify-end">
              <TokenLogo currency="ZCHF" chain="polygon" />
              <div className="flex flex-col text-right">
                <Link
                  className="underline"
                  href={frankenLinkPolygon}
                  target="_blank"
                >
                  Frankencoin (PoS) Contract
                </Link>
                <Link
                  href={
                    "https://app.uniswap.org/swap?inputCurrency=0xc2132D05D31c914a87C6611C10748AEb04B58e8F&outputCurrency=0x02567e4b14b25549331fCEe2B56c647A8bAB16FD&chain=polygon"
                  }
                  target="_blank"
                  className="underline text-sm text-slate-500"
                >
                  Uniswap Pool
                </Link>
              </div>
            </div>
          </AppBox>
          <AppBox className="col-span-6 sm:col-span-3">
            <DisplayLabel label="Arbitrum Bridge" />
            <div className="flex items-center py-2 justify-end">
              <TokenLogo currency="ZCHF" chain="arbitrum" />
              <div className="flex flex-col text-right">
                <Link
                  className="underline"
                  href={frankenLinkArb}
                  target="_blank"
                >
                  Frankencoin (Arb) Contract
                </Link>
                <Link
                  href={
                    "https://app.uniswap.org/swap?inputCurrency=0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9&outputCurrency=0xB33c4255938de7A6ec1200d397B2b2F329397F9B&chain=arbitrum"
                  }
                  target="_blank"
                  className="underline text-sm text-slate-500"
                >
                  Uniswap Pool
                </Link>
              </div>
            </div>
          </AppBox>
          <AppBox className="col-span-6 sm:col-span-3">
            <DisplayLabel label="Optimism Bridge" />
            <div className="flex items-center py-2 justify-end">
              <TokenLogo currency="ZCHF" chain="optimism" />
              <div className="flex flex-col text-right">
                <Link
                  className="underline"
                  href={frankenLinkOp}
                  target="_blank"
                >
                  Frankencoin (Op) Contract
                </Link>
                <Link
                  href={
                    "https://app.uniswap.org/swap?inputCurrency=0x94b008aA00579c1307B0EF2c499aD98a8ce58e58&outputCurrency=0x05cA43316288B51948b706046cF0bA3c62c8b725&chain=optimism"
                  }
                  target="_blank"
                  className="underline text-sm text-slate-500"
                >
                  Uniswap Pool
                </Link>
              </div>
            </div>
          </AppBox>
        </div>
        <hr className="my-12 border-dashed border-slate-800" />
        <section>
          <h2 className="text-2xl font-bold text-center">
            Wallets and Exchanges
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-6 gap-4 p-4 items-center">
            <Link
              href="https://www.aktionariat.com/all-companies"
              target="_blank"
              className="flex items-center justify-center sm:col-span-2"
            >
              <picture>
                <img
                  src="/coin/aktionariat.png"
                  alt="aktionariat logo"
                  className="h-12"
                />
              </picture>
              <picture>
                <img
                  src="/coin/aktionariat2.svg"
                  className="h-6 ml-2"
                  alt="aktionariat name"
                />
              </picture>
            </Link>
            <Link
              href="https://exchange.dfx.swiss/"
              target="_blank"
              className="flex items-center justify-center sm:col-span-2"
            >
              <picture>
                <img src="/coin/dfx.svg" alt="dfx logo" className="h-8" />
              </picture>
              <span className="font-bold text-4xl text-white ml-2">Swiss</span>
            </Link>
            <Link
              href="https://app.uniswap.org/swap?inputCurrency=0xdAC17F958D2ee523a2206206994597C13D831ec7&outputCurrency=0xB58E61C3098d85632Df34EecfB899A1Ed80921cB&chain=mainnet"
              target="_blank"
              className="flex items-center justify-center sm:col-span-2"
            >
              <picture>
                <img
                  src="/assets/uniswap.svg"
                  alt="dfx logo"
                  className="h-14 mb-3"
                />
              </picture>
              <span className="font-bold text-4xl text-white ml-2">
                Uniswap
              </span>
            </Link>
            <Link
              href="https://ammer.cash/"
              target="_blank"
              className="flex items-center justify-center sm:col-span-2 sm:col-start-2"
            >
              <picture>
                <img
                  src="/partner/ammer.svg"
                  alt="ammer logo"
                  className="h-14"
                />
              </picture>
              <span className="font-bold text-4xl text-white ml-2">
                Ammer Cash
              </span>
            </Link>
            <Link
              href="https://zippy.swiss/"
              target="_blank"
              className="flex items-center justify-center sm:col-span-2"
            >
              <picture>
                <img
                  src="/partner/zippy.svg"
                  alt="zippy logo"
                  className="h-14"
                />
              </picture>
            </Link>
          </div>
          <div className="flex">
            <Link
              href={SOCIAL.Github_dapp}
              className="text-link text-center w-full"
              target="_blank"
            >
              Create a pull request if you want to be added here
            </Link>
          </div>
        </section>
        {/* 
          <hr className="my-12 border-dashed border-slate-800" />

          <h2 className="text-2xl font-bold text-center">
            Frankencoin Pool Shares (FPS)
          </h2>
          <div className="bg-slate-900 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <AppBox>
              <p>
                The Frankencoin system receives income in the form of fees, and
                it can incur losses in case a collateral proved to be
                insufficient. These go into a reserve pool. If the Frankencoin
                system was a company, this reserve pool would be called
                <em>equity</em>. It accumulates profits and absorbs losses.
                Anyone can contribute to the reserve pool, thereby getting
                freshly minted Frankencoin Pool Share (FPS) tokens. Anyone who
                held onto their FPS tokens for long enough, namely at least 90
                days, can also redeem them again against Frankencoins from the
                reserve pool at any time. If the Frankencoin&apos;s equity has
                grown in the meantime, you will make a profit (and a loss if it
                declined). Essentially, this is a system of continuous issuance
                and redemption inspired by the idea of the&nbsp;
                <a
                  href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4189472"
                  target="_blank"
                  rel="noreferrer"
                >
                  Continuous Capital Corporation
                </a>
                . Holders of reserve pool shares enjoy veto power for new
                minting mechanisms as long as they have at least 2% of the
                time-weighted outstanding shares.
              </p>
            </AppBox>
            <div>
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
                  <h3 className="font-bold text-center">Inspect contract</h3>
                  <Link
                    className="btn btn-secondary px-3 py-2"
                    href={frankenLink}
                    target="_blank"
                  >
                    {shortenAddress(ADDRESS[chainId].equity)}
                    <FontAwesomeIcon
                      icon={faUpRightFromSquare}
                      className="w-3 h-3"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-12 border-dashed border-slate-800" />
          <h2 className="text-2xl font-bold text-center">
            Stablecoin Conversion
          </h2>
          <div className="bg-slate-900 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <AppBox>
              <p>
                Bridge contracts allow to convert other Swiss Franc stablecoins
                1:1 into Frankencoins and also back again as long as there are
                some left. The deposited stablecoins are kept in the bridge
                until another user wants to convert ZCHF back into the
                resprective stablecoin. <br />
                For now, the only bridge is the one to the&nbsp;
                <a
                  href="https://www.bitcoinsuisse.com/cryptofranc"
                  target="_blank"
                  rel="noreferrer"
                >
                  Crypto Franc (XCHF)
                </a>
                .
              </p>
            </AppBox>
            <div>
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
                  <h3 className="font-bold text-center">Inspect contract</h3>
                  <Link
                    className="btn btn-secondary px-3 py-2"
                    href={frankenLink}
                    target="_blank"
                  >
                    {shortenAddress(ADDRESS[chainId].bridge)}
                    <FontAwesomeIcon
                      icon={faUpRightFromSquare}
                      className="w-3 h-3"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-12 border-dashed border-slate-800" />

          <h2 className="text-2xl font-bold text-center">
            Collateralized Positions
          </h2>
          <div className="bg-slate-900 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <AppBox>
              <p>
                Collateralized minting positions allow their owner to mint ZCHF
                against a collateral. Anyone can open new collateral positions
                and start minting ZCHF once the initialization period has
                passed. Positions that are not sufficiently collateralized can
                be challenged by anyone through an auction mechanism. When
                challenging a position, the challenger must provide some of the
                collateral to be auctioned off. If the highest bid in the
                subsequent auction is high enough to show that the position is
                sufficiently collateralized, the challenge is averted and the
                bidder gets the challengers collateral in exchange for the
                highest bid. If the highest bid is lower, the challenge is
                considered successful, the bidder gets the collateral from the
                position and the position is closed, distributing excess
                proceeds to the reserve and paying a reward to the challenger.
              </p>
            </AppBox>
            <div className="mx-auto my-8 flex w-auto flex-col items-center justify-center">
              <AppPageHeader title="Minting Hub" />
              <Link
                className="btn btn-secondary px-3 py-2"
                href={frankenLink}
                target="_blank"
              >
                {shortenAddress(ADDRESS[chainId].mintingHub)}
                <FontAwesomeIcon
                  icon={faUpRightFromSquare}
                  className="w-3 h-3"
                />
              </Link>
            </div>
          </div>
        </section> */}
      </main>
    </>
  );
}
