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
	
	const href = {
		pathname: to,
		query: router.query
	};

	return (
		<Link
			className={`btn btn-nav max-md:bg-card-body-primary max-md:w-full max-md:rounded-2xl py-3 hover:text-menu-hover ${
				active ? "text-menu-active font-semibold" : "text-menu-text"
			}`}
			href={external ? to : href}
			target={external ? "_blank" : "_self"}
		>
			{name}
		</Link>
	);
}
