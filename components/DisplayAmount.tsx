import { TOKEN_LOGO, formatBigInt } from "@utils";

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
      {!hideLogo && currency && TOKEN_LOGO[currency.toLowerCase()] && (
        <picture className="mr-2">
          <img
            src={TOKEN_LOGO[currency.toLowerCase()]}
            className="w-8"
            alt="token-logo"
          />
        </picture>
      )}
      <div>
        <span className={`${bold && "font-bold"} ${big && "text-3xl"}`}>
          {formatBigInt(amount, Number(digits))}
        </span>
        <span>&nbsp;{currency}</span>
      </div>
    </div>
  );
}
