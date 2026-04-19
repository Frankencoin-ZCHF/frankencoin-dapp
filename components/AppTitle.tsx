import dynamic from "next/dynamic";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

const TokenLogo = dynamic(() => import("./TokenLogo"), { ssr: false });

interface BadgeProps {
	label: string;
	className: string;
}

interface Props {
	title?: string;
	symbol?: string;
	icon?: IconDefinition;
	url?: string;
	className?: string;
	classNameTitle?: string;
	badge?: string;
	badgeColor?: string;
	badges?: BadgeProps[];
	subtitle?: string | React.ReactNode;
	actions?: React.ReactNode;
	children?: React.ReactElement | React.ReactElement[];
}

export default function AppTitle({
	title,
	symbol,
	icon,
	url,
	className,
	classNameTitle,
	badge,
	badgeColor = "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
	badges,
	subtitle,
	actions,
	children,
}: Props) {
	const hasHeader = symbol || icon || url || title;

	return (
		<div className={`${className} pt-6`}>
			{(hasHeader || actions) && (
				<div className={actions ? "flex flex-col md:flex-row md:items-center justify-between gap-3" : undefined}>
					<div>
						{hasHeader && (
							<div className="flex items-center gap-2 flex-wrap">
								{symbol && <TokenLogo currency={symbol} />}
								{icon && <FontAwesomeIcon icon={icon} className="w-8 h-8" />}
								{url && <Image src={url} width={32} height={32} className="rounded-full" alt="logo" unoptimized />}
								{title && <span className={`${classNameTitle} font-bold text-2xl text-text-primary`}>{title}</span>}
								{badge && <span className={`${badgeColor} text-sm font-medium px-2.5 py-0.5 rounded-lg`}>{badge}</span>}
								{badges?.map((b, i) => (
									<span key={i} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${b.className}`}>
										{b.label}
									</span>
								))}
							</div>
						)}
						{subtitle && <div className="mt-1 text-text-secondary text-sm">{subtitle}</div>}
					</div>
					{actions && <div>{actions}</div>}
				</div>
			)}
			{children ?? null}
		</div>
	);
}
