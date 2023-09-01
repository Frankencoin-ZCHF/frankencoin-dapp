import { useAccount } from "wagmi";
import { usePositionLists } from "../../hooks";
import PositionRow from "./PositionRow";
import { zeroAddress } from "viem";
import TableHeader from "../Table/TableHead";
import TableBody from "../Table/TableBody";
import Table from "../Table";
import TableRowEmpty from "../Table/TableRowEmpty";

interface Props {
  showMyPos?: boolean;
}

export default function PositionTable({ showMyPos }: Props) {
  const { address } = useAccount();
  const positions = usePositionLists();
  const account = address || zeroAddress;
  const matchingPositions = positions.filter((position) =>
    showMyPos ? position.owner == account : position.owner != account
  );

  return (
    <Table>
      <TableHeader
        headers={[
          "Collateral",
          "Liquidation Price",
          "Available Amount",
          "Expiration Date",
        ]}
        actionCol
      />
      <TableBody>
        {matchingPositions.length == 0 ? (
          <TableRowEmpty>
            {showMyPos
              ? "You don't have any positions."
              : "There are no other positions yet."}
          </TableRowEmpty>
        ) : (
          matchingPositions.map((pos) => (
            <PositionRow
              position={pos.position}
              collateral={pos.collateral}
              key={pos.position}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
}
