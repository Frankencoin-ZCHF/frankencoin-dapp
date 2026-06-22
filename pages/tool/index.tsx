import Head from "next/head";
import AppTitle from "@components/AppTitle";
import AppCard from "@components/AppCard";
import Link from "next/link";

const TOOLS = [
	{
		href: "/tool/erc20",
		title: "ERC-20 Token Tools",
		description: "Transfer tokens to any address, set spending allowances, or sign gasless permit messages (ERC-2612).",
		actions: ["Transfer", "Approve", "Permit"],
	},
	{
		href: "/tool/erc4626",
		title: "ERC-4626 Vault Tools",
		description: "Interact with any tokenized vault — deposit or withdraw assets, mint or redeem shares.",
		actions: ["Deposit", "Mint", "Withdraw", "Redeem"],
	},
	{
		href: "/tool/authorize",
		title: "Authorization Tools",
		description: "Create and submit signed transfer authorizations (ERC-3009) for gasless or delegated token transfers.",
		actions: ["Create Payload", "Execute Authorization"],
	},
];

export default function ToolPage() {
	return (
		<>
			<Head>
				<title>Frankencoin - Tools</title>
			</Head>

			<AppTitle title="Tools">
				<div className="text-text-secondary">
					Low-level utilities for interacting with ERC-20, ERC-4626, and ERC-3009 contracts on any supported chain.
				</div>
			</AppTitle>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
				{TOOLS.map((tool) => (
					<Link key={tool.href} href={tool.href} className="block group">
						<AppCard className="p-5 flex flex-col gap-3 h-full hover:ring-2 hover:ring-card-input-focus transition-all">
							<div className="font-bold text-lg text-text-primary group-hover:text-button-default transition-colors">
								{tool.title}
							</div>
							<div className="text-text-secondary text-sm flex-1">{tool.description}</div>
							<div className="flex flex-wrap gap-2">
								{tool.actions.map((a) => (
									<span
										key={a}
										className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
									>
										{a}
									</span>
								))}
							</div>
						</AppCard>
					</Link>
				))}
			</div>
		</>
	);
}
