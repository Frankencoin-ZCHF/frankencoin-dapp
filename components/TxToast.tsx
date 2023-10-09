import Link from "next/link";
import { useNetwork } from "wagmi";
import { shortenHash, transactionLink } from "@utils";
import { Hash } from "viem";

export const TxToast = (props: {
  title: string;
  rows: { title: string; value?: string | JSX.Element; hash?: Hash }[];
  success?: boolean;
}) => {
  const { title, rows, success = true } = props;
  const { chain } = useNetwork();

  return (
    <div className="flex flex-col">
      <div className="font-bold mb-2">{title}</div>
      {rows.map((row) => (
        <div
          className="flex items-center gap-1 justify-between text-sm"
          key={row.title}
        >
          <div>{row.title}</div>
          {row.hash ? (
            <Link
              href={transactionLink(
                chain?.blockExplorers?.default.url,
                row.hash
              )}
              target="_blank"
              className="text-link"
            >
              {shortenHash(row.hash)}
            </Link>
          ) : (
            <div>{row.value}</div>
          )}
        </div>
      ))}
    </div>
  );
};
