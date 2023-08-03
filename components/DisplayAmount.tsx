import { commify } from "@ethersproject/units";
import { formatUnits } from "viem";

interface Props {
  amount: bigint
  bold?: boolean,
  big?: boolean,
  noRounding?: boolean,
  digits?: number | bigint,
  currency?: string
}

export default function DisplayAmount({
  amount,
  bold,
  big,
  noRounding,
  digits = 18,
  currency
}: Props) {
  return (
    <>
      <span className={`font-bold ${big && 'text-3xl'}`}>
        {commify(formatUnits(amount, Number(digits)))}
      </span>
      <span>
        &nbsp;{currency}
      </span>
    </>
  )
}