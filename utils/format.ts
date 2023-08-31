import { commify } from "@ethersproject/units";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import { Address, Hash, formatUnits, getAddress } from "viem";

dayjs.extend(duration);
dayjs.extend(relativeTime);

export const formatCurrency = (value: string, digits = 2) => {
  const amount = parseFloat(value);

  if (amount === null || !!isNaN(amount)) return null;

  if (amount < 0.01 && amount > 0 && digits) {
    return "< 0.01";
  }

  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits ? digits : 18,
    minimumFractionDigits: 0,
  });

  return formatter.format(amount);
};

export const formatDecimals = (value: string) => {
  let string = String(value);
  const patterns = [".0", "."];

  patterns.forEach((pattern) => {
    string = string.endsWith(pattern) ? string.replace(pattern, "") : string;
  });

  return string;
};

export const formatCommify = (amount: string | bigint) => {
  const formatted = formatDecimals(amount.toString());

  return commify(formatted);
};

export const formatNumber = (amount: bigint, decimals: number = 18) => {
  return commify(formatUnits(amount, decimals));
};

export const shortenString = (str: string) => {
  return str.substring(0, 6) + "..." + str.substring(str.length - 4);
};

export const shortenAddress = (address: Address): string => {
  try {
    const formattedAddress = getAddress(address);
    return shortenString(formattedAddress);
  } catch {
    throw new TypeError("Invalid input, address can't be parsed");
  }
};

export const shortenHash = (hash: Hash): string => {
  try {
    return shortenString(hash);
  } catch {
    throw new TypeError("Invalid input, Hash can't be parsed");
  }
};

export const decodeBigIntCall = (data: any): bigint => {
  if (data.error || !data.result) return 0n;
  else return BigInt(String(data.result));
};

export const decodeStringCall = (data: any): string => {
  if (data.error) return "";
  else return String(data.result);
};

export const formatDate = (timestamp: number | bigint): string => {
  const date = dayjs(Number(timestamp) * 1000);
  return date.format("YYYY-MM-DD");
};

export const formatDuration = (timestamp: number | bigint): string => {
  const duration = dayjs.duration(Number(timestamp), "seconds").humanize(false);

  return timestamp > 0 ? duration : "-";
};

export const isDateExpired = (timestamp: number | bigint): boolean => {
  const date = dayjs(Number(timestamp) * 1000);
  return date.isBefore();
};
