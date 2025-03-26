import { useRouter } from "next/router";
import { getCarryOnQueryParams, toQueryString } from "@utils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function PositionManage() {
	const router = useRouter();
	const { address, tab } = router.query;
	const carryOnQueryParams = getCarryOnQueryParams(router);
	router.replace(`/mint/${address}/manage/${tab || "collateral"}${toQueryString(carryOnQueryParams)}`);

	return null;
}

export async function getServerSideProps({ locale }: { locale: string }) {
	return {
		props: {
			...(await serverSideTranslations(locale, ["common"])),
		},
	};
}
