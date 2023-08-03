import { commify } from '@ethersproject/units';
import { ethers } from 'ethers';
import { Address, getAddress } from 'viem';

export const formatCurrency = (value: string, digits = 2) => {
  const amount = parseFloat(value);

  if (amount === null || !!isNaN(amount)) return null;

  if (amount < 0.01 && amount > 0 && digits) {
    return '< 0.01';
  }

  const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits ? digits : 18,
    minimumFractionDigits: 0,
  });

  return formatter.format(amount);
};

export const formatDecimals = (value: string) => {
  let string = String(value);
  const patterns = ['.0', '.'];

  patterns.forEach((pattern) => {
    string = string.endsWith(pattern) ? string.replace(pattern, '') : string;
  });

  return string;
};

export const formatCommify = (amount: string | bigint) => {
  const formatted = formatDecimals(amount.toString());

  return commify(formatted)
};

export const shortenString = (str: string) => {
  return str.substring(0, 6) + '...' + str.substring(str.length - 4)
}

export const shortenAddress = (address: Address): string => {
  try {
    const formattedAddress = getAddress(address)
    return shortenString(formattedAddress)
  } catch {
    throw new TypeError("Invalid input, address can't be parsed")
  }
}

export const decodeBigIntCall = (data: any): bigint => {
  if (data.error || !data.result) return 0n;
  else return BigInt(String(data.result));
}

export const decodeStringCall = (data: any): string => {
  if (data.error) return '';
  else return String(data.result);
}

export const formatDate = (timestamp: number | bigint): string => {
  const date = new Date(Number(timestamp) * 1000);
  return date.toISOString().split('T')[0]
}