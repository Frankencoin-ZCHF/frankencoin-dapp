import Link from "next/link";
import { useRouter } from "next/router";

interface Props {
	to: string;
	name: string;
	external?: boolean;
}

export default function NavButton({ to, name, external }: Props) {
	const router = useRouter();
	const active = router.pathname.includes(to);
	return (
		<Link
			className={`flex md:btn md:btn-nav md:py-2 max-md:py-[10px] max-md:pl-[16px] max-md:w-[160px] max-md:text-left hover:text-menu-hover font-medium ${
				active ? "text-menu-textactive bg-menu-active rounded-lg font-semibold" : "text-menu-text"
			}`}
			href={to}
			target={external ? "_blank" : "_self"}
		>
			{name}
		</Link>
	);
}
