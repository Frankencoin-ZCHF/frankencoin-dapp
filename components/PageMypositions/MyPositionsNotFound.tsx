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

	console.log({ query, explorerLink });

	return (
		<>
			<Head>
				<title>Frankencoin - Manage Position</title>
			</Head>

			<AppTitle title={`Manage Position `}>
				<div className="text-text-secondary">
					Position not found. The system is either still indexing the address:{" "}
					<AppLink className="" label={query} href={explorerLink} external={true} /> or the position does not exist.
					<AppLink
						className=""
						label=" Ping us on Github if you think this is a bug"
						href={SOCIAL.Github_dapp_new_issue}
						external={true}
					/>
				</div>
			</AppTitle>
		</>
	);
}
