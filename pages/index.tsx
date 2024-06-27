import { useRouter } from "next/navigation";

export default function MainPage() {
	const router = useRouter();
	router.push("/borrow");

	return null;
}
