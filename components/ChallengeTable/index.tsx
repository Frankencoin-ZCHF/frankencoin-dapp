import ChallengeRow from "./ChallengeRow";
import { Challenge } from "../../hooks";

interface Props {
  challenges: Challenge[];
  noContentText: string;
}

export default function ChallengeTable({ challenges, noContentText }: Props) {
  return (
    <section>
      <div className="space-y-3">
        <div className="hidden items-center justify-between rounded-lg bg-white dark:bg-slate-800 py-5 px-8 md:flex xl:px-16">
          <div className="hidden flex-grow grid-cols-2 items-center text-gray-300 md:grid md:grid-cols-5">
            <span className="leading-tight">Auctionated Collateral</span>
            <span className="leading-tight">Highest Bid</span>
            <span className="leading-tight">Buy now Price</span>
            <span className="leading-tight">Owner</span>
            <span className="leading-tight">State</span>
          </div>
          <div className="w-40 flex-shrink-0"></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1 lg:gap-2">
          {challenges.map((challenge) => (
            <ChallengeRow
              position={challenge.position}
              challenger={challenge.challenger}
              challengeSize={challenge.size}
              bid={challenge.bid}
              end={challenge.end}
              index={challenge.index}
              key={Number(challenge.index)}
            />
          ))}
          {challenges.length == 0 && (
            <div className="rounded-lg bg-white dark:bg-slate-800 p-8 xl:px-16">
              <div className="flex flex-col justify-between gap-y-5 md:flex-row md:space-x-4">
                {noContentText}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
