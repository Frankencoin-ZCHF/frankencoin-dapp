import { useAccount } from "wagmi";
import { usePositionLists } from "../../hooks";
import PositionRow from "./PositionRow";
import { zeroAddress } from "viem";

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
    <section>
      <div className="space-y-3">
        <div className="hidden items-center justify-between rounded-lg bg-white dark:bg-slate-800 py-5 px-8 md:flex xl:px-16">
          <div className="hidden flex-grow grid-cols-2 items-center text-gray-300 md:grid md:grid-cols-4">
            <span className="leading-tight">Collateral</span>
            <span className="leading-tight">Liquidation Price</span>
            <span className="leading-tight">Available Amount</span>
            <span className="leading-tight">Expiration Date</span>
          </div>
          <div className="w-40 flex-shrink-0"></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1 lg:gap-2">
          {matchingPositions.map((pos) => (
            <PositionRow
              position={pos.position}
              collateral={pos.collateral}
              key={pos.position}
            />
          ))}
          {matchingPositions.length == 0 && (
            <div className="rounded-lg bg-white dark:bg-slate-800 p-8 xl:px-16">
              <div className="flex flex-col justify-between gap-y-5 md:flex-row md:space-x-4">
                {showMyPos
                  ? "You don't have positions."
                  : "There are no other positions yet."}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
