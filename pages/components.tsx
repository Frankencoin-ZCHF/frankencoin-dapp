import Head from "next/head";
import { useState } from "react";
import dynamic from "next/dynamic";
import AppTitle from "@components/AppTitle";
import PageTabInput from "@components/Input/PageTabInput";
import AppButton from "@components/AppButton";
import AppButtonSecondary from "@components/AppButtonSecondary";
import AppLink from "@components/AppLink";
import NormalInput from "@components/Input/NormalInput";
import DateInput from "@components/Input/DateInput";
import { TabInput } from "@components/Input/TabInput";
import AppToggle from "@components/AppToggle";
import AppBox from "@components/AppBox";
import AppCard from "@components/AppCard";
import AppHeroSteps from "@components/AppHeroSteps";
import DisplayAmount from "@components/DisplayAmount";
import DisplayLabel from "@components/DisplayLabel";
import LoadingSpin from "@components/LoadingSpin";
import Table from "@components/Table";
import TableHead from "@components/Table/TableHead";
import TableHeadSearchable, { FilterOption } from "@components/Table/TableHeadSearchable";
import TableBody from "@components/Table/TableBody";
import TableRow from "@components/Table/TableRow";
import TableRowEmpty from "@components/Table/TableRowEmpty";

const TokenLogo = dynamic(() => import("@components/TokenLogo"), { ssr: false });

function DemoSection({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="pt-8 space-y-3">
			<div className="text-xs font-bold uppercase tracking-widest text-text-secondary border-b border-card-input-border pb-2">
				{title}
			</div>
			<div>{children}</div>
		</div>
	);
}

function ButtonsTab() {
	return (
		<div>
			<DemoSection title="AppButton">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					<AppButton onClick={() => {}}>Primary</AppButton>
					<AppButton disabled onClick={() => {}}>Disabled</AppButton>
					<AppButton isLoading onClick={() => {}}>Loading</AppButton>
					<AppButton error="Something went wrong" onClick={() => {}}>With Error</AppButton>
					<AppButton warning="Double-check before proceeding" onClick={() => {}}>With Warning</AppButton>
					<AppButton note="This action is irreversible" onClick={() => {}}>With Note</AppButton>
					<AppButton to="/savings">As Link (to=)</AppButton>
				</div>
			</DemoSection>

			<DemoSection title="AppButtonSecondary">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					<AppButtonSecondary onClick={() => {}}>Secondary</AppButtonSecondary>
					<AppButtonSecondary disabled onClick={() => {}}>Disabled</AppButtonSecondary>
					<AppButtonSecondary isLoading onClick={() => {}}>Loading</AppButtonSecondary>
					<AppButtonSecondary error="Action failed" onClick={() => {}}>With Error</AppButtonSecondary>
					<AppButtonSecondary warning="Double-check before proceeding" onClick={() => {}}>With Warning</AppButtonSecondary>
					<AppButtonSecondary note="This action is irreversible" onClick={() => {}}>With Note</AppButtonSecondary>
					<AppButtonSecondary to="/savings">As Link (to=)</AppButtonSecondary>
				</div>
			</DemoSection>

			<DemoSection title="AppLink">
				<div className="flex flex-col gap-2">
					<AppLink label="Internal link (arrow icon)" href="/" icon className="flex items-center gap-1" />
					<AppLink label="External link" href="https://frankencoin.com" external className="flex items-center gap-1" />
					<AppLink label="No icon, custom style" href="/" className="flex items-center text-text-primary underline" />
				</div>
			</DemoSection>
		</div>
	);
}

function InputsTab() {
	const [normalValue, setNormalValue] = useState("");
	const [dateValue, setDateValue] = useState(new Date("2026-12-31"));
	const [tabValue, setTabValue] = useState("Option A");
	const [toggleOn, setToggleOn] = useState(true);

	return (
		<div>
			<DemoSection title="NormalInput">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<NormalInput
						label="Amount"
						symbol="ZCHF"
						value={normalValue}
						onChange={setNormalValue}
						note="Enter an amount to send"
					/>
					<NormalInput label="With Error" symbol="ZCHF" value="" error="Insufficient balance" />
					<NormalInput label="With Warning" symbol="ZCHF" value="100" warning="Amount is above the recommended limit" />
					<NormalInput label="Disabled" symbol="ZCHF" value="500" disabled />
				</div>
			</DemoSection>

			<DemoSection title="DateInput">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<DateInput
						label="Expiration Date"
						value={dateValue}
						onChange={(d) => d && setDateValue(d)}
						note="Select an expiration date"
					/>
					<DateInput label="Disabled" value={new Date("2026-06-01")} disabled />
					<DateInput label="With Error" value={new Date("2026-01-01")} error="Date is in the past" />
				</div>
			</DemoSection>

			<DemoSection title="TabInput">
				<TabInput tabs={["Option A", "Option B", "Option C"]} tab={tabValue} setTab={setTabValue} />
				<p className="text-sm text-text-secondary mt-2">Active: {tabValue}</p>
			</DemoSection>

			<DemoSection title="AppToggle">
				<div className="flex flex-col gap-3">
					<AppToggle label="Off state" enabled={false} onChange={() => {}} />
					<AppToggle label="On state" enabled={true} onChange={() => {}} />
					<AppToggle label="Controlled (click me)" enabled={toggleOn} onChange={setToggleOn} />
					<AppToggle label="Disabled (on)" enabled={true} disabled />
					<AppToggle label="Disabled (off)" enabled={false} disabled />
				</div>
			</DemoSection>
		</div>
	);
}

function LayoutTab() {
	return (
		<div>
			<DemoSection title="AppBox">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<AppBox>
						<p className="text-text-secondary text-sm">Default padding</p>
					</AppBox>
					<AppBox title="With Title">
						<p className="text-text-secondary text-sm">Content below the title</p>
					</AppBox>
					<AppBox tight>
						<p className="text-text-secondary text-sm">Tight padding (px-3 py-2)</p>
					</AppBox>
				</div>
			</DemoSection>

			<DemoSection title="AppCard">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<AppCard>
						<p className="text-text-secondary text-sm">Balance</p>
						<p className="text-text-primary font-bold text-xl">1,234.56 ZCHF</p>
					</AppCard>
					<AppCard>
						<p className="text-text-secondary text-sm">Reserve Ratio</p>
						<p className="text-text-primary font-bold text-xl">78.9%</p>
					</AppCard>
					<AppCard>
						<p className="text-text-secondary text-sm">Total Supply</p>
						<p className="text-text-primary font-bold text-xl">42,000,000</p>
					</AppCard>
				</div>
			</DemoSection>

			<DemoSection title="AppHeroSteps">
				<AppHeroSteps
					steps={[
						{ icon: 1, title: "First Step", description: "Provide collateral to open a position." },
						{ icon: 2, title: "Second Step", description: "Mint ZCHF against your collateral." },
						{ icon: 3, title: "Third Step", description: "Repay anytime to recover collateral." },
					]}
				/>
			</DemoSection>

			<DemoSection title="AppTitle">
				<div className="divide-y divide-card-input-border">
					<AppTitle title="Simple Title" />
					<AppTitle title="With Badge" badge="New" />
					<AppTitle title="With Subtitle" subtitle="A supporting line below the heading" />
					<AppTitle
						title="With Multiple Badges"
						badges={[
							{ label: "v2", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" },
							{ label: "Active", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200" },
						]}
					/>
					<AppTitle
						title="With Actions"
						actions={
							<AppButton width="w-auto" onClick={() => {}}>
								Action Button
							</AppButton>
						}
					/>
					<AppTitle symbol="ZCHF" title="With Token Logo" />
				</div>
			</DemoSection>
		</div>
	);
}

function DisplayTab() {
	return (
		<div>
			<DemoSection title="DisplayAmount">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<AppCard>
						<DisplayLabel label="String output">
							<DisplayAmount output="1,234.56" unit="ZCHF" />
						</DisplayLabel>
					</AppCard>
					<AppCard>
						<DisplayLabel label="Bold + Big">
							<DisplayAmount output="9,876.00" unit="FPS" bold big />
						</DisplayLabel>
					</AppCard>
					<AppCard>
						<DisplayLabel label="Zero / empty">
							<DisplayAmount unit="ZCHF" />
						</DisplayLabel>
					</AppCard>
					<AppCard>
						<DisplayLabel label="From bigint (18 dec)">
							<DisplayAmount amount={1500000000000000000n} digits={18} unit="ZCHF" bold />
						</DisplayLabel>
					</AppCard>
					<AppCard>
						<DisplayLabel label="Number input">
							<DisplayAmount amount={42.5} unit="%" />
						</DisplayLabel>
					</AppCard>
				</div>
			</DemoSection>

			<DemoSection title="DisplayLabel">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<AppCard>
						<DisplayLabel label="Label only" />
					</AppCard>
					<AppCard>
						<DisplayLabel label="With child content">
							<span className="text-text-primary font-semibold">100.00 ZCHF</span>
						</DisplayLabel>
					</AppCard>
					<AppCard>
						<DisplayLabel label="Nested DisplayAmount">
							<DisplayAmount output="3,210.00" unit="FPS" bold />
						</DisplayLabel>
					</AppCard>
				</div>
			</DemoSection>

			<DemoSection title="TokenLogo">
				<div className="flex flex-wrap gap-6 items-end">
					{[
						{ symbol: "ZCHF", size: 12 },
						{ symbol: "FPS", size: 10 },
						{ symbol: "WFPS", size: 8 },
						{ symbol: "WBTC", size: 8 },
						{ symbol: "ETH", size: 8 },
						{ symbol: "USDC", size: 8 },
						{ symbol: "USDT", size: 8 },
						{ symbol: "DAI", size: 8 },
					].map(({ symbol, size }) => (
						<div key={symbol} className="flex flex-col items-center gap-1">
							<TokenLogo currency={symbol} size={size} />
							<span className="text-xs text-text-secondary">{symbol}</span>
						</div>
					))}
				</div>
				<div className="mt-4 flex flex-wrap gap-6 items-end">
					<div className="flex flex-col items-center gap-1">
						<TokenLogo currency="WBTC" size={8} chain="arbitrum" />
						<span className="text-xs text-text-secondary">With chain badge</span>
					</div>
					<div className="flex flex-col items-center gap-1">
						<TokenLogo currency="USDC" size={8} chain="optimism" />
						<span className="text-xs text-text-secondary">Optimism</span>
					</div>
					<div className="flex flex-col items-center gap-1">
						<TokenLogo currency="UNKNOWN_XYZ" size={8} />
						<span className="text-xs text-text-secondary">Fallback icon</span>
					</div>
				</div>
			</DemoSection>

			<DemoSection title="LoadingSpin">
				<div className="flex items-center gap-6">
					<div className="flex items-center gap-3">
						<div className="p-3 bg-button-default rounded-lg flex items-center justify-center">
							<LoadingSpin />
						</div>
						<span className="text-text-secondary text-sm">Default (white on primary)</span>
					</div>
					<div className="flex items-center gap-3">
						<AppButton isLoading onClick={() => {}}>
							Inside Button
						</AppButton>
					</div>
				</div>
			</DemoSection>
		</div>
	);
}

const MOCK_ROWS = [
	{ symbol: "ZCHF", category: "Stablecoin", balance: 1234.56, value: 1234.56, inWallet: true },
	{ symbol: "FPS", category: "Governance", balance: 42.0, value: 8400.0, inWallet: true },
	{ symbol: "WBTC", category: "BTC", balance: 0.025, value: 2250.0, inWallet: false },
	{ symbol: "ETH", category: "ETH", balance: 1.5, value: 4500.0, inWallet: true },
	{ symbol: "USDC", category: "Stablecoin", balance: 500.0, value: 500.0, inWallet: false },
	{ symbol: "DAI", category: "Stablecoin", balance: 200.0, value: 200.0, inWallet: false },
];

const FILTER_OPTIONS: FilterOption[] = [
	{ label: "Stablecoin", value: "Stablecoin" },
	{ label: "Governance", value: "Governance" },
	{ label: "BTC", value: "BTC" },
	{ label: "ETH", value: "ETH" },
];

function SearchableTableDemo() {
	const headers = ["Asset", "Balance", "Value (USD)"];
	const [tab, setTab] = useState(headers[0]);
	const [reverse, setReverse] = useState(false);
	const [search, setSearch] = useState("");
	const [inMyWallet, setInMyWallet] = useState(false);
	const [activeFilters, setActiveFilters] = useState<string[]>([]);

	const handleTabChange = (h: string) => {
		if (tab === h) setReverse((r) => !r);
		else { setReverse(false); setTab(h); }
	};

	const filtered = MOCK_ROWS
		.filter((r) => !search || r.symbol.toLowerCase().includes(search.toLowerCase()))
		.filter((r) => !inMyWallet || r.inWallet)
		.filter((r) => activeFilters.length === 0 || activeFilters.includes(r.category))
		.sort((a, b) => {
			const dir = reverse ? -1 : 1;
			if (tab === "Asset") return dir * a.symbol.localeCompare(b.symbol);
			if (tab === "Balance") return dir * (b.balance - a.balance);
			return dir * (b.value - a.value);
		});

	return (
		<Table>
			{[
				<TableHeadSearchable
					key="head"
					headers={headers}
					tab={tab}
					reverse={reverse}
					tabOnChange={handleTabChange}
					colSpan={3}
					searchPlaceholder="Search assets…"
					searchValue={search}
					onSearchChange={setSearch}
					inMyWallet={inMyWallet}
					onInMyWalletChange={setInMyWallet}
					filterOptions={FILTER_OPTIONS}
					activeFilters={activeFilters}
					onFiltersChange={setActiveFilters}
				/>,
				<TableBody key="body">
					{filtered.length === 0 ? (
						<TableRowEmpty>No assets match your filters.</TableRowEmpty>
					) : (
						(filtered.map((row) => (
							<TableRow key={row.symbol} tab={tab} headers={headers} colSpan={3}>
								{[
									<div key="a" className="text-left font-semibold text-text-primary">{row.symbol}</div>,
									<div key="b">{row.balance.toLocaleString()}</div>,
									<div key="c">${row.value.toLocaleString()}</div>,
								] as React.ReactElement[]}
							</TableRow>
						)) as unknown as React.ReactElement)
					)}
				</TableBody>,
			] as React.ReactElement[]}
		</Table>
	);
}

function TableTab() {
	const headers = ["Asset", "Balance", "Value (USD)"];
	const [tab, setTab] = useState(headers[0]);
	const [reverse, setReverse] = useState(false);

	const handleTabChange = (h: string) => {
		if (tab === h) {
			setReverse((r) => !r);
		} else {
			setReverse(false);
			setTab(h);
		}
	};

	return (
		<div>
			<DemoSection title="TableHeadSearchable">
				<SearchableTableDemo />
			</DemoSection>

			<DemoSection title="Table + TableHead + TableBody + TableRow">
				<Table>
					{
						[
							<TableHead
								key="head"
								headers={headers}
								tab={tab}
								reverse={reverse}
								tabOnChange={handleTabChange}
								colSpan={3}
							/>,
							<TableBody key="body">
								{
									[
										<TableRow key="row1" tab={tab} headers={headers} colSpan={3}>
											{
												[
													<div key="a1" className="text-left font-semibold text-text-primary">
														ZCHF
													</div>,
													<div key="a2">1,234.56</div>,
													<div key="a3">$1,234.56</div>,
												] as React.ReactElement[]
											}
										</TableRow>,
										<TableRow key="row2" tab={tab} headers={headers} colSpan={3}>
											{
												[
													<div key="b1" className="text-left font-semibold text-text-primary">
														FPS
													</div>,
													<div key="b2">42.00</div>,
													<div key="b3">$8,400.00</div>,
												] as React.ReactElement[]
											}
										</TableRow>,
										<TableRow key="row3" tab={tab} headers={headers} colSpan={3}>
											{
												[
													<div key="c1" className="text-left font-semibold text-text-primary">
														WBTC
													</div>,
													<div key="c2">0.025</div>,
													<div key="c3">$2,250.00</div>,
												] as React.ReactElement[]
											}
										</TableRow>,
									] as React.ReactElement[]
								}
							</TableBody>,
						] as React.ReactElement[]
					}
				</Table>
			</DemoSection>

			<DemoSection title="TableRowEmpty">
				<Table>
					{
						[
							<TableHead key="head" headers={headers} tab="" colSpan={3} />,
							<TableBody key="body">
								<TableRowEmpty>No positions found for the selected filters.</TableRowEmpty>
							</TableBody>,
						] as React.ReactElement[]
					}
				</Table>
			</DemoSection>
		</div>
	);
}

export default function ComponentsPage() {
	const tabs = [
		{ label: "Buttons", content: <ButtonsTab /> },
		{ label: "Inputs", content: <InputsTab /> },
		{ label: "Layout", content: <LayoutTab /> },
		{ label: "Display", content: <DisplayTab /> },
		{ label: "Table", content: <TableTab /> },
	];

	return (
		<>
			<Head>
				<title>Frankencoin - Component Library</title>
			</Head>
			<AppTitle title="Component Library" subtitle="Visual reference for all shared UI components" />
			<PageTabInput tabs={tabs} className="mt-4" />
		</>
	);
}
