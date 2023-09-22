import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import AppPageHeader from "../../../components/AppPageHeader";
import AppBox from "../../../components/AppBox";
import DisplayLabel from "../../../components/DisplayLabel";
import DisplayAmount from "../../../components/DisplayAmount";
import { formatDate, shortenAddress } from "../../../utils";
import { getAddress, zeroAddress } from "viem";
import { useContractUrl } from "../../../hooks/useContractUrl";
import {
  useChallengeListStats,
  useChallengeLists,
  usePositionStats,
} from "../../../hooks";
import { useAccount, useChainId, useContractRead } from "wagmi";
import { ABIS, ADDRESS } from "../../../contracts";
import ChallengeTable from "../../../components/ChallengeTable";

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

  const { data: positionAssignedReserve } = useContractRead({
    address: ADDRESS[chainId].frankenCoin,
    abi: ABIS.FrankenCoinABI,
    functionName: "calculateAssignedReserve",
    args: [positionStats.minted, Number(positionStats.reserveContribution)],
    enabled: positionStats.isSuccess,
  });

  return (
    <>
      <Head>FrankenCoin - Position Overview</Head>
      <div>
        <AppPageHeader
          title={`Overview Position ${address && shortenAddress(position)}`}
          link={explorerUrl}
          backTo="/positions"
          backText="Back to positions"
        />
        <section>
          <div className="mx-auto flex max-w-2xl flex-col gap-y-4 px-4 sm:px-8">
            <AppBox>
              <div className="flex flex-col gap-12">
                <div className="grid grid-cols-1 gap-x-1 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                  <DisplayLabel label="Borrowed Total">
                    <DisplayAmount
                      amount={positionStats.minted}
                      currency="ZCHF"
                    />
                  </DisplayLabel>
                  <DisplayLabel label="Collateral">
                    <DisplayAmount
                      amount={positionStats.collateralBal}
                      currency={positionStats.collateralSymbol}
                    />
                  </DisplayLabel>
                  <DisplayLabel label="Liquidation Price">
                    <DisplayAmount
                      amount={positionStats.liqPrice}
                      currency={"ZCHF"}
                    />
                  </DisplayLabel>
                  <DisplayLabel label="Retained Reserve">
                    <DisplayAmount
                      amount={positionAssignedReserve || 0n}
                      currency={"ZCHF"}
                    />
                  </DisplayLabel>
                  <DisplayLabel label="Limit">
                    <DisplayAmount
                      amount={positionStats.limit}
                      currency={"ZCHF"}
                    />
                  </DisplayLabel>
                  <DisplayLabel label="Owner">
                    <Link
                      href={ownerLink}
                      className="text-link"
                      target="_blank"
                    >
                      <b>{shortenAddress(positionStats.owner)}</b>
                    </Link>
                  </DisplayLabel>
                  <DisplayLabel label="Expiration Date">
                    <b>{formatDate(positionStats.expiration)}</b>
                  </DisplayLabel>
                  <DisplayLabel label="Reserve Requirement">
                    <DisplayAmount
                      amount={positionStats.reserveContribution / 100n}
                      digits={2}
                      currency={"%"}
                    />
                  </DisplayLabel>
                  <DisplayLabel label="Minting Fee">
                    <DisplayAmount
                      amount={positionStats.mintingFee / 100n}
                      digits={2}
                      currency={"%"}
                    />
                  </DisplayLabel>
                </div>
                <div className="mx-auto w-72 max-w-full flex-col">
                  {positionStats.owner == account ? (
                    <Link
                      href={`/position/${position}/adjust`}
                      className="btn btn-primary w-full"
                    >
                      Adjust
                    </Link>
                  ) : (
                    <div className="flex flex-col gap-y-4">
                      <Link
                        href={`/position/${position}/borrow`}
                        className="btn btn-primary w-full"
                      >
                        Borrow
                      </Link>
                      <Link
                        href={`/position/${position}/challenge`}
                        className="btn btn-primary w-full"
                      >
                        Challenge
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </AppBox>
          </div>
          <AppPageHeader title="Open Challenges" className="mt-8" />
          <ChallengeTable
            challenges={challengsData}
            noContentText="This position is currently not being challenged."
            loading={loading || queryLoading}
          />
        </section>
      </div>
    </>
  );
}
