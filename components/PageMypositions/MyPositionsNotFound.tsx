import AppLink from "@components/AppLink";
import { shortenAddress, SOCIAL } from "@utils";
import Head from "next/head";
import { Address, zeroAddress } from "viem";
import { useContractUrl } from "@hooks";
import AppTitle from "@components/AppTitle";

interface Props {
	query: string;
}

export default function MyPositionsNotFound({ query }: Props) {
	const explorerLink = useContractUrl(query);

	return (
		<>
			<Head>
				<title>Frankencoin - Manage Position</title>
			</Head>

			<AppTitle title={`Manage Position `}>
				<div className="text-text-secondary">
					Position not found. If this position was recently created, it may take a few minutes to be indexed. If you can verify
					this is a valid position on <AppLink className="" label="the Explorer" href={explorerLink} external={true} /> but it is
					not appearing here, please{" "}
					<AppLink className="" label="file a bug report" href={SOCIAL.Github_dapp_new_issue} external={true} /> including the
					current URL.
				</div>
			</AppTitle>
		</>
	);
}
