import { useAccount } from "wagmi";
import { commify } from "@ethersproject/units";
import { formatUnits } from "viem";
import DisplayAmount from "./DisplayAmount";
import { TOKEN_LOGO } from "../utils";
import { BigNumberInput } from "./BigNumberInput";

interface Props {
  label?: string;
  symbol: string;
  placeholder?: string;
  fromWallet?: boolean;
  max?: bigint;
  digit?: bigint | number;
  hideMaxLabel?: boolean;
  limit?: bigint;
  limitLabel?: string;
  showOutput?: boolean;
  output?: string;
  note?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
}

export default function SwapFieldInput({
  label = "Send",
  placeholder = "Input Amount",
  symbol,
  max = 0n,
  digit = 18n,
  fromWallet = true,
  hideMaxLabel,
  limit = 0n,
  limitLabel,
  showOutput = false,
  output,
  note,
  value,
  onChange,
  error,
}: Props) {
  const { isConnected } = useAccount();

  return (
    <div>
      <div className="mb-1 flex gap-2 px-1">
        <div className="flex-1">{label}</div>
        {isConnected && symbol && (
          <div
            className={`flex gap-2 items-center cursor-pointer ${
              hideMaxLabel && "hidden"
            }`}
            onClick={() => onChange && onChange(max.toString())}
          >
            Balance :{" "}
            <span className="font-bold text-link">
              {commify(formatUnits(max, 18))} {symbol}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center rounded-lg bg-neutral-200 dark:bg-slate-700 p-2">
        {TOKEN_LOGO[symbol.toLowerCase()] && (
          <div className="hidden w-12 sm:block">
            <picture>
              <img
                src={TOKEN_LOGO[symbol.toLowerCase()]}
                className="w-10"
                alt="token-logo"
              />
            </picture>
          </div>
        )}
        <div className="flex-1">
          {showOutput ? (
            <div className="px-3 py-2 font-bold transition-opacity">
              {output}
            </div>
          ) : (
            <div
              className={`flex gap-1 rounded-lg dark:text-white p-1 ${
                error
                  ? "bg-red-300 dark:bg-rose-700"
                  : "bg-neutral-100 dark:bg-slate-500"
              }`}
            >
              <BigNumberInput
                autofocus={true}
                decimals={Number(digit)}
                placeholder={placeholder}
                value={value || ""}
                onChange={(e) => onChange?.(e)}
                className={`w-full flex-1 rounded-lg bg-transparent px-2 py-1 text-lg`}
              />
            </div>
          )}
        </div>

        <div className="hidden w-20 px-4 text-end font-bold sm:block">
          {symbol}
        </div>
      </div>
      {error && <div className="mt-2 px-1 text-red-500">{error}</div>}
      <div className="mt-2 px-1 flex items-center">
        {limit >= 0n && limitLabel && (
          <>
            <span>{limitLabel} :&nbsp;</span>
            <DisplayAmount amount={limit} currency={symbol} />
          </>
        )}
        {note && <span>{note}</span>}
      </div>
    </div>
  );
}
