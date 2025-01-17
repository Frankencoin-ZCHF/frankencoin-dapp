import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import { Address, Hash, formatUnits, getAddress } from "viem";

dayjs.extend(duration);
dayjs.extend(relativeTime);

export const toTimestamp = (value: Date) => {
	return Math.floor(value.getTime() / 1000);
};

export function toDate(time: bigint | number | string) {
	const v: bigint = BigInt(time);
	return new Date(Number(v) * 1000);	
}

export enum FormatType {
	"us",
	"tiny",
}

export const formatCurrency = (value: string | number, minimumFractionDigits = 0, maximumFractionDigits = 2, format = FormatType.tiny) => {
	const amount = typeof value === "string" ? parseFloat(value) : value;

	// exceptions
	if (amount === null || !!isNaN(amount)) return null;
	if (amount < 0.01 && amount > 0 && maximumFractionDigits) {
		return "< 0.01";
	}

	// us
	if (format === FormatType.us) {
		const formatter = new Intl.NumberFormat("en-US", {
			maximumFractionDigits,
			minimumFractionDigits,
		});
		return formatter.format(amount);
	}

	// tiny
	if (format === FormatType.tiny) {
		const formatter = new Intl.NumberFormat("en-US", {
			maximumFractionDigits: amount < 1000 && amount > -1000 ? 2 : 0,
			minimumFractionDigits: amount < 1000 && amount > -1000 ? 2 : 0,
		});
		return formatter.format(amount).split(",").join(" ");
	}
};

export function formatNumber(value: string): string {
	let [floor, decimals] = value.split(".");
	if (!decimals) {
		decimals = "00";
	}
	decimals = (parseFloat(value) - parseFloat(floor)).toFixed(2).toString().split(".")[1];
	return [floor.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,"), decimals].join(".");
}

export const formatBigInt = (value?: bigint, units = 18, displayDec = 2): string => {
	if (!value) {
		value = 0n;
	}
	const valString = formatUnits(value, units);
	const decimalTrimmed = (() => {
		if (displayDec === 0) {
			return valString.split(".")[0];
		}
		const reg = new RegExp(`(\\.\\d{` + displayDec + `}).*`);
		return valString.replace(reg, "$1");
	})();

	let displayNum = formatNumber(decimalTrimmed);
	if (parseFloat(decimalTrimmed) === 0 && value > 0) {
		// if display shows zero for a non-zero amount,
		// show that the amount is less than display setting ex < 0.001
		displayNum = `< ${displayNum.replace(/.$/, "1")}`;
	}

	return displayNum;
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

export const transactionLink = (explorerUrl: string | undefined, hash: Hash): string => {
	try {
		return explorerUrl + "/tx/" + hash;
	} catch {
		throw new TypeError("Invalid input, Hash can't be parsed");
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

export const formatDateLocale = (timestamp: number | bigint): string => {
	const date = dayjs(Number(timestamp) * 1000);
	return date.toISOString().replaceAll("-", "").replaceAll(":", "").replaceAll(".", "");
};

export const formatDate = (timestamp: number | bigint): string => {
	const date = dayjs(Number(timestamp) * 1000);
	return date.format("YYYY-MM-DD HH:mm");
};

export const formatDateDuration = (timestamp: number | bigint): string => {
	const date = dayjs(Number(timestamp) * 1000);
	return dayjs.duration(date.toISOString()).humanize(true);
};

export const formatDuration = (time: number | bigint): string => {
	const duration = dayjs.duration(Number(time), "seconds").humanize(false);

	return time > 0 ? duration : "-";
};

export const isDateExpired = (timestamp: number | bigint): boolean => {
	const date = dayjs(Number(timestamp) * 1000);
	return date.isBefore();
};

export const isDateUpcoming = (timestamp: number | bigint): boolean => {
	const date = dayjs(Number(timestamp) * 1000);
	return date.isAfter();
};
