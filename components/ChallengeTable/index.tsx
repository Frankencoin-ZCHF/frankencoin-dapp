import ChallengeRow from "./ChallengeRow";
import { Challenge } from "@hooks";
import TableRowEmpty from "../Table/TableRowEmpty";
import LoadingSpin from "../LoadingSpin";

interface Props {
  challenges: Challenge[];
  noContentText: string;
  loading?: boolean;
}

export default function ChallengeTable({
  challenges,
  noContentText,
  loading,
}: Props) {
  return (
    <div className="bg-slate-950 rounded-xl p-4">
      <div className="text-lg font-bold text-center mb-4">Open Challenges</div>
      <div className="bg-slate-900 rounded-xl p-2 flex flex-col gap-2">
        {loading ? (
          <TableRowEmpty>
            <div className="flex items-center">
              <LoadingSpin classes="mr-3" />
              Loading...
            </div>
          </TableRowEmpty>
        ) : challenges.length == 0 ? (
          <TableRowEmpty>{noContentText}</TableRowEmpty>
        ) : (
          challenges.map((challenge) => (
            <ChallengeRow
              position={challenge.position}
              challenger={challenge.challenger}
              challengeSize={challenge.size}
              filledSize={challenge.filledSize}
              fixedEnd={challenge.fixedEnd}
              auctionEnd={challenge.auctionEnd}
              duration={challenge.duration}
              price={challenge.price}
              index={challenge.index}
              key={Number(challenge.index)}
            />
          ))
        )}
      </div>
    </div>
  );
}
