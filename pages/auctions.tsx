import Head from "next/head";
import AppPageHeader from "../components/AppPageHeader";
import { zeroAddress } from "viem";
import { useChallengeListStats, useChallengeLists } from "../hooks";
import { useAccount } from "wagmi";
import ChallengeTable from "../components/ChallengeTable";

export default function Auction({ }) {
  const { address } = useAccount()
  const challenges = useChallengeLists({})
  const challengeStats = useChallengeListStats(challenges)
  const account = address || zeroAddress;

  return (
    <>
      <Head>FrankenCoin - Auction</Head>
      <div>
        <AppPageHeader title="My Auctions" />
        <ChallengeTable
          challenges={challengeStats.filter(challenge => challenge.challenger == account)}
          noContentText="You don't have any auction."
        />

        <AppPageHeader title="All Auctions" className="mt-8" />
        <ChallengeTable
          challenges={challengeStats.filter(challenge => challenge.challenger != account)}
          noContentText="There are no auctions yet."
        />
      </div>
    </>
  )
}