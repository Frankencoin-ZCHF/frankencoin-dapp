import ChallengeRow from "./ChallengeRow";
import { Challenge } from "../../hooks";
import Table from "../Table";
import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
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
    <Table>
      <TableHeader
        headers={["Auction", "Remaining", "Buy Now Price", "Owner", "State"]}
      />
      <TableBody>
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
      </TableBody>
    </Table>
  );
}
