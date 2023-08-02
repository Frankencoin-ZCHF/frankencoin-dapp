import { commify } from "@ethersproject/units";
import { formatUnits } from "viem";

interface Props {
  amount: bigint
  bold?: boolean,
  big?: boolean,
  noRounding?: boolean,
  digits?: number,
  currency?: string
}

export default function DisplayAmount({
  amount,
  bold,
  big,
  noRounding,
  digits,
  currency
}: Props) {
  return (
    <>
      {amount ?
        <span className={`font-bold ${big && 'text-3xl'}`}>
          {commify(formatUnits(amount, digits || 18))}
        </span>
        : '-'
      }
      <span>
        &nbsp;{currency}
      </span>
    </>
  )
}