import Link from "next/link";
import AppButton from "./AppButton";
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
		<Link className={`btn btn-nav ${active && "text-rose-500"}`} href={to} target={external ? "_blank" : "_self"}>
			{name}
		</Link>
	);
}
