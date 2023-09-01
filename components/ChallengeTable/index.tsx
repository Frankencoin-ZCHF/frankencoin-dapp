import ChallengeRow from "./ChallengeRow";
import { Challenge } from "../../hooks";
import Table from "../Table";
import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import TableRowEmpty from "../Table/TableRowEmpty";

interface Props {
  challenges: Challenge[];
  noContentText: string;
}

export default function ChallengeTable({ challenges, noContentText }: Props) {
  return (
    <Table>
      <TableHeader
        headers={[
          "Auctionated Collateral",
          "Highest Bid",
          "Buy now Price",
          "Owner",
          "State",
        ]}
        actionCol
      />
      <TableBody>
        {challenges.length == 0 ? (
          <TableRowEmpty>{noContentText}</TableRowEmpty>
        ) : (
          challenges.map((challenge) => (
            <ChallengeRow
              position={challenge.position}
              challenger={challenge.challenger}
              challengeSize={challenge.size}
              bid={challenge.bid}
              end={challenge.end}
              index={challenge.index}
              key={Number(challenge.index)}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
}
