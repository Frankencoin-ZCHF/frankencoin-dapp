import Link from "next/link";
import { useRouter } from "next/router";
import { track } from "../hooks/useAnalytics";

interface Props {
	to: string;
	name: string;
	external?: boolean;
}

export default function NavButton({ to, name, external }: Props) {
	const router = useRouter();
	const active = router.pathname.includes(to);
	const umamiEvent = "nav_" + name.toLowerCase().replace(/\s+/g, "_");
	return (
		<Link
			className={`flex md:btn md:btn-nav md:py-2 max-md:py-[10px] max-md:pl-[16px] max-md:w-[160px] md:w-full hover:bg-menu-hover hover:text-menu-text font-medium ${
				active ? "text-menu-textactive bg-menu-active rounded-lg font-semibold" : "text-menu-text"
			}`}
			href={to}
			target={external ? "_blank" : "_self"}
			onClick={() => track(umamiEvent)}
		>
			{name}
		</Link>
	);
}
