import Head from "next/head";
import AppTitle from "@components/AppTitle";
import AppHeroSteps from "@components/AppHeroSteps";
import AppLink from "@components/AppLink";
import RatingCard from "@components/PageRatings/RatingCard";
import { useRatings } from "../hooks/useRatings";
import type { XerberusEntityType } from "@utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved, faBookOpen, faLink } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

type RatingCardDef = {
	type: XerberusEntityType;
	id: string;
	name: string;
	subtitle: string;
};

const RATING_CARDS: RatingCardDef[] = [
	{ type: "protocol", id: "frankencoin", name: "Frankencoin", subtitle: "Protocol" },
	{ type: "organisation", id: "frankencoin-dao", name: "Frankencoin", subtitle: "DAO" },
	{ type: "pool", id: "frankencoin-savings-eth", name: "Frankencoin Savings", subtitle: "Ethereum Vault" },
];

const UNIQUE_TYPES: XerberusEntityType[] = Array.from(new Set(RATING_CARDS.map((c) => c.type)));

export default function RatingsPage() {
	const { data, loading, error } = useRatings({ types: UNIQUE_TYPES });
	const byKey = new Map(data.map((r) => [`${r.type}:${r.id}`, r]));

	return (
		<>
			<Head>
				<title>Frankencoin - Ratings</title>
			</Head>

			<AppTitle title="Ratings">
				<div className="text-text-secondary">
					Independently rated by{" "}
					<Image src="/partner/xerberus.svg" alt="" width={16} height={16} className="h-4 w-4 inline align-middle mr-1 mb-1" />
					<AppLink label="Xerberus" href="https://xerberus.io/" external={true} className="inline" />, an open-source on-chain
					risk-rating protocol with no affiliation to Frankencoin. Each score reflects a transparent, automated analysis of public
					on-chain data.
				</div>
			</AppTitle>

			<AppHeroSteps
				steps={[
					{
						icon: <FontAwesomeIcon icon={faShieldHalved} />,
						title: "Independent",
						description: "Ratings are produced by Xerberus, an external open-source protocol, not by the Frankencoin DAO.",
					},
					{
						icon: <FontAwesomeIcon icon={faBookOpen} />,
						title: "Open Methodology",
						description:
							"Every calculation is public and documented. No black-box algorithms, no hidden biases. Full intellectual transparency.",
					},
					{
						icon: <FontAwesomeIcon icon={faLink} />,
						title: "Verifiable Sources",
						description:
							"Because the math is open, the data must be too. Xerberus pulls directly from on-chain truth to feed its models.",
					},
				]}
			/>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{RATING_CARDS.map((c) => (
					<RatingCard
						key={`${c.type}:${c.id}`}
						name={c.name}
						subtitle={c.subtitle}
						type={c.type}
						id={c.id}
						rating={byKey.get(`${c.type}:${c.id}`)}
						loading={loading}
						error={error}
					/>
				))}
			</div>
		</>
	);
}
