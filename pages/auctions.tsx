import Head from "next/head";
import { zeroAddress } from "viem";
import { useChallengeListStats, useChallengeLists } from "@hooks";
import { useAccount } from "wagmi";
import AppPageHeader from "@components/AppPageHeader";
import ChallengeTable from "@components/ChallengeTable";

export default function Auction({}) {
  const { address } = useAccount();
  const { challenges, loading: queryLoading } = useChallengeLists({});
  const { challengsData, loading } = useChallengeListStats(challenges);
  const account = address || zeroAddress;

  return (
    <>
      <Head>
        <title>Frankencoin - Auction</title>
      </Head>
      <div>
        <AppPageHeader title="My Auctions" />
        <ChallengeTable
          challenges={challengsData.filter(
            (challenge) => challenge.challenger == account
          )}
          noContentText="You don't have any auction."
          loading={loading || queryLoading}
        />

        <AppPageHeader title="All Auctions" className="mt-8" />
        <ChallengeTable
          challenges={challengsData.filter(
            (challenge) => challenge.challenger != account
          )}
          noContentText="There are no auctions yet."
          loading={loading || queryLoading}
        />
      </div>
    </>
  );
}
