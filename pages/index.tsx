import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/navigation";

export default function MainPage() {
	const router = useRouter();
	router.push("/mint");

	return null;
}

export async function getStaticProps({ locale }: { locale: string }) {
	return {
		props: {
			...(await serverSideTranslations(locale, ["common"])),
		},
	};
}