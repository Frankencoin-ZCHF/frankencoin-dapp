import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export const LinkTitle = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return (
        <Link
            href={href}
            className="mb-7 items-center justify-start flex gap-1 text-button-text-default-text hover:text-button-text-hover-text group"
        >
            <span className="text-2xl font-black">{children}</span>
			<FontAwesomeIcon icon={faArrowUpRightFromSquare} width={16} height={16} className="group-hover:text-inherit" />
		</Link>
	);
};

export const HeaderCell = ({ className, children }: { className?: string; children: React.ReactNode }) => {
	return <span className={`text-text-primary text-xs font-medium leading-[1.125rem] ${className}`}>{children}</span>;
};

export const NoDataRow = ({ className, children }: { className?: string; children: React.ReactNode }) => {
	return (
        <>
            <span className="w-11 pr-3"></span>
            <span className={`py-[1.125rem] mb-1.5 text-text-muted2 text-base font-[350] leading-tight ${className}`}>
                {children}
            </span>
        </>
	);
};