import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { getCarryOnQueryParams, toQueryString } from "@utils";

export default function MainPage() {
	const router = useRouter();
	const carryOnQueryParams = getCarryOnQueryParams(router);

	router.push(`/dashboard${toQueryString(carryOnQueryParams)}`);

	return null;
}

export async function getStaticProps({ locale }: { locale: string }) {
	return {
		props: {
			...(await serverSideTranslations(locale, ["common"])),
		},
	};
}