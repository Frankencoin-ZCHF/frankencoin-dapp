import { useAccount, } from "wagmi";
import AppIcon from "./AppIcon";
import { commify } from "@ethersproject/units";
import { formatUnits } from "viem";
import DisplayAmount from "./DisplayAmount";

interface Props {
  label?: string
  symbol: string
  placeholder?: string
  fromWallet?: boolean
  max?: bigint
  digit?: bigint | number
  hideMaxLabel?: boolean
  limit?: bigint
  limitLabel?: string,
  showOutput?: boolean
  output?: string
  note?: string
  value?: string
  onChange?: (value: string) => void
  error?: boolean
}

export default function SwapFieldInput({
  label = 'Send',
  placeholder = 'Input Amount',
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
  error
}: Props) {
  const { isConnected } = useAccount()

  return (
    <div>
      <div className="mb-1 flex gap-2 px-1 font-bold">
        <div className="flex-1">
          {label}
        </div>
        {isConnected && symbol &&
          <div
            className={`flex gap-2 items-center cursor-pointer underline ${hideMaxLabel && 'hidden'}`}
            onClick={() => onChange && onChange(formatUnits(max, Number(digit)))}
          >
            <AppIcon src="/assets/wallet.svg" size="small" />
            {commify(formatUnits(max, 18))} {symbol}
          </div>
        }
      </div>

      <div className="flex items-center rounded-lg bg-neutral-200 p-2">
        <div className="flex-1">
          {showOutput ?
            <div
              className="px-3 py-2 font-bold transition-opacity"
            >{output}</div>
            :
            <div className={`flex gap-1 rounded-lg bg-neutral-100 p-1 ${error && 'bg-red-300'}`}>
              <input
                type="number"
                inputMode="decimal"
                className={`w-full flex-1 rounded-lg bg-transparent px-2 py-1 text-lg`}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
              />
            </div>
          }
        </div>

        <div className="hidden w-20 px-4 text-end font-bold sm:block">
          {symbol}
        </div>
      </div>
      <div className="mt-2 px-1">
        {limit >= 0n && limitLabel &&
          <span>
            {limitLabel} :&nbsp;
            <DisplayAmount amount={limit} currency={symbol} />
          </span>
        }
        {note &&
          <span>{note}</span>
        }
      </div>
    </div >
  )
}