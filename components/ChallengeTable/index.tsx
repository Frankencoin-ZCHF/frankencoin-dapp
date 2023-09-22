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
        headers={["Auctionated Collateral", "Current Price", "Owner", "State"]}
        actionCol
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
              end={challenge.end}
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
