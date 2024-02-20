import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import AppPageHeader from "@components/AppPageHeader";
import AppBox from "@components/AppBox";
import DisplayLabel from "@components/DisplayLabel";
import DisplayAmount from "@components/DisplayAmount";
import { formatDate, shortenAddress } from "@utils";
import { getAddress, zeroAddress } from "viem";
import {
  useChallengeListStats,
  useChallengeLists,
  useContractUrl,
  usePositionStats,
  useTokenPrice,
} from "@hooks";
import { useAccount, useChainId, useContractRead } from "wagmi";
import { ABIS, ADDRESS } from "@contracts";
import ChallengeTable from "@components/ChallengeTable";

export default function PositionDetail() {
  const router = useRouter();
  const { address } = router.query;
  const explorerUrl = useContractUrl(String(address));
  const position = getAddress(String(address || zeroAddress));

  const chainId = useChainId();
  const { address: account } = useAccount();
  const positionStats = usePositionStats(position);
  const ownerLink = useContractUrl(positionStats.owner);
  const { challenges, loading: queryLoading } = useChallengeLists({ position });
  const { challengsData, loading } = useChallengeListStats(challenges);
  const collateralPrice = useTokenPrice(positionStats.collateral);
  const zchfPrice = useTokenPrice(ADDRESS[chainId].frankenCoin);

  const { data: positionAssignedReserve } = useContractRead({
    address: ADDRESS[chainId].frankenCoin,
    abi: ABIS.FrankencoinABI,
    functionName: "calculateAssignedReserve",
    args: [positionStats.minted, Number(positionStats.reserveContribution)],
    enabled: positionStats.isSuccess,
  });

  const isSubjectToCooldown = () => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    return (
      now < positionStats.cooldown && positionStats.cooldown < 32508005122n
    );
  };

  return (
    <>
      <Head>
        <title>Frankencoin - Position Overview</title>
      </Head>
      <div>
        <AppPageHeader
          title={`Position Overview ${address && shortenAddress(position)}`}
          link={explorerUrl}
          backTo="/positions"
          backText="Back to positions"
        />
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 rounded-xl p-4 flex flex-col gap-y-4">
            <div className="text-lg font-bold text-center">
              Position Details
            </div>
            <div className="bg-slate-900 rounded-xl p-4 grid gap-2 grid-cols-2 lg:grid-cols-6">
              <AppBox className="col-span-3">
                <DisplayLabel label="Borrowed Total" />
                <DisplayAmount
                  amount={positionStats.minted}
                  currency="ZCHF"
                  address={ADDRESS[chainId].frankenCoin}
                  usdPrice={zchfPrice}
                />
              </AppBox>
              <AppBox className="col-span-3">
                <DisplayLabel label="Collateral" />
                <DisplayAmount
                  amount={positionStats.collateralBal}
                  currency={positionStats.collateralSymbol}
                  digits={positionStats.collateralDecimal}
                  address={positionStats.collateral}
                  usdPrice={collateralPrice}
                />
              </AppBox>
              <AppBox className="col-span-3">
                <DisplayLabel label="Liquidation Price" />
                <DisplayAmount
                  amount={positionStats.liqPrice}
                  currency={"ZCHF"}
                  digits={36 - positionStats.collateralDecimal}
                  address={ADDRESS[chainId].frankenCoin}
                  usdPrice={zchfPrice}
                />
              </AppBox>
              <AppBox className="col-span-3">
                <DisplayLabel label="Retained Reserve" />
                <DisplayAmount
                  amount={positionAssignedReserve || 0n}
                  currency={"ZCHF"}
                  address={ADDRESS[chainId].frankenCoin}
                  usdPrice={zchfPrice}
                />
              </AppBox>
              <AppBox className="col-span-3">
                <DisplayLabel label="Limit" />
                <DisplayAmount
                  amount={positionStats.limit}
                  currency={"ZCHF"}
                  address={ADDRESS[chainId].frankenCoin}
                  usdPrice={zchfPrice}
                />
              </AppBox>
              <AppBox className="col-span-1 sm:col-span-3">
                <DisplayLabel label="Owner" />
                <Link href={ownerLink} className="text-link" target="_blank">
                  <b>{shortenAddress(positionStats.owner)}</b>
                </Link>
              </AppBox>
              <AppBox className="col-span-2 sm:col-span-2">
                <DisplayLabel label="Expiration Date" />
                <b>
                  {positionStats.closed
                    ? "Closed"
                    : formatDate(positionStats.expiration)}
                </b>
              </AppBox>
              <AppBox className="col-span-1 sm:col-span-2">
                <DisplayLabel label="Reserve Requirement" />
                <DisplayAmount
                  amount={positionStats.reserveContribution / 100n}
                  digits={2}
                  currency={"%"}
                  hideLogo
                />
              </AppBox>
              <AppBox className="col-span-2 sm:col-span-2">
                <DisplayLabel label="Annual Interest" />
                <DisplayAmount
                  amount={positionStats.annualInterestPPM / 100n}
                  digits={2}
                  currency={"%"}
                  hideLogo
                />
              </AppBox>
            </div>
            <div className="mt-4 w-full flex">
              {positionStats.owner == account ? (
                <Link
                  href={`/position/${position}/adjust`}
                  className="btn btn-primary w-72 m-auto"
                >
                  Adjust
                </Link>
              ) : (
                <>
                  <Link
                    href={`/position/${position}/borrow`}
                    className={`btn btn-primary flex-1 ${
                      isSubjectToCooldown() && "btn-disabled"
                    }`}
                  >
                    Borrow
                  </Link>
                  <Link
                    href={`/position/${position}/challenge`}
                    className="btn btn-primary flex-1 ml-4"
                  >
                    Challenge
                  </Link>
                </>
              )}
            </div>
          </div>
          <div>
            {isSubjectToCooldown() && (
              <div className="bg-slate-950 rounded-xl p-4 flex flex-col mb-4">
                <div className="text-lg font-bold text-center">Cooldown</div>
                <AppBox className="flex-1 mt-4">
                  <p>
                    This position is subject to a cooldown period that ends
                    on {formatDate(positionStats.cooldown)} as its owner has
                    recently increased the applicable liquidation price. The
                    cooldown period gives other users an opportunity to
                    challenge the position before additional Frankencoins can be minted.
                  </p>
                </AppBox>
              </div>
            )}
            <ChallengeTable
              challenges={challengsData}
              noContentText="This position is currently not being challenged."
              loading={loading || queryLoading}
            />
          </div>
        </section>
      </div>
    </>
  );
}
