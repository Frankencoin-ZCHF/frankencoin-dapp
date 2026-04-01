import dynamic from "next/dynamic";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

const TokenLogo = dynamic(() => import("./TokenLogo"), { ssr: false });

interface Props {
	title?: string;
	symbol?: string;
	icon?: IconDefinition;
	url?: string;
	className?: string;
	classNameTitle?: string;
	children?: React.ReactElement | React.ReactElement[];
}

export default function AppTitle({ title, symbol, icon, url, className, classNameTitle, children }: Props) {
	return (
		<div className={`${className} pt-6`}>
			{(symbol || icon || url || title) && (
				<div className="flex items-center gap-3">
					{symbol && <TokenLogo currency={symbol} />}
					{icon && <FontAwesomeIcon icon={icon} className="w-8 h-8" />}
					{url && <Image src={url} width={32} height={32} className="rounded-full" alt="logo" unoptimized />}
					{title && <span className={`${classNameTitle} font-bold text-2xl text-text-primary`}>{title}</span>}
				</div>
			)}
			{children ?? null}
		</div>
	);
}
