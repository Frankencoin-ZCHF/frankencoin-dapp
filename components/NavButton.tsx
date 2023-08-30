import Link from "next/link";
import AppButton from "./AppButton";
import { useRouter } from "next/router";

interface Props {
  to: string;
  name: string;
}

export default function NavButton({ to, name }: Props) {
  const router = useRouter();
  const active = router.pathname.includes(to);
  return (
    <Link className={`btn btn-nav ${active && "text-rose-500"}`} href={to}>
      {name}
    </Link>
  );
}
