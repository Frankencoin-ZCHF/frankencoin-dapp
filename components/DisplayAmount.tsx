import { commify } from "@ethersproject/units";
import { formatUnits } from "viem";
import { TOKEN_LOGO } from "../utils";

interface Props {
  amount: bigint
  bold?: boolean,
  big?: boolean,
  noRounding?: boolean,
  digits?: number | bigint,
  currency?: string
  hideLogo?: boolean
}

export default function DisplayAmount({
  amount,
  bold = false,
  big,
  noRounding,
  digits = 18,
  currency,
  hideLogo,
}: Props) {
  return (
    <div className="flex items-center">
      {!hideLogo && currency && TOKEN_LOGO[currency.toLowerCase()] &&
        <picture className="mr-2">
          <img src={TOKEN_LOGO[currency.toLowerCase()]} className="w-8" alt="token-logo" />
        </picture>
      }
      <div>
        <span className={`${bold && 'font-bold'} ${big && 'text-3xl'}`}>
          {commify(formatUnits(amount, Number(digits)))}
        </span>
        <span>
          &nbsp;{currency}
        </span>
      </div>
    </div>
  )
}