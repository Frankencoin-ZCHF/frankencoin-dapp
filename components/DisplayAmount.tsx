import { formatBigInt } from "@utils";
import dynamic from "next/dynamic";
const TokenLogo = dynamic(() => import("./TokenLogo"), { ssr: false });

interface Props {
  amount: bigint;
  bold?: boolean;
  big?: boolean;
  noRounding?: boolean;
  digits?: number | bigint;
  currency?: string;
  hideLogo?: boolean;
  className?: string;
}

export default function DisplayAmount({
  amount,
  bold = false,
  big,
  noRounding,
  digits = 18,
  currency,
  hideLogo,
  className,
}: Props) {
  return (
    <div className={`flex items-center ${className}`}>
      {!hideLogo && currency && <TokenLogo currency={currency} />}
      <div>
        <span className={`${bold && "font-bold"} ${big && "text-3xl"}`}>
          {formatBigInt(amount, Number(digits))}
        </span>
        <span>&nbsp;{currency}</span>
      </div>
    </div>
  );
}
