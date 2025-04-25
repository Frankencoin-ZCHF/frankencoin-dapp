import { useState } from "react";
import Link from "next/link";
import WalletConnect from "./WalletConnect";
import NavButton from "./NavButton";
import { useIsMainnet } from "@hooks";
import { CONFIG } from "../../app.config";
import { GlobalPreferences } from "./GlobalPreferences";
import { useTranslation } from "next-i18next";
import Image from "next/image";
import { LanguageSelectorDropdown } from "./LanguageSelector";

export function NavItems() {
	const isMainet = useIsMainnet();
	const { t } = useTranslation();

	return (
		<>
			<li className="inline-block 2md:hidden">
				<NavButton to="/referrals" name={t("common.navbar.my_referrals")} />
			</li>
			<li>
				<NavButton to="/dashboard" name={t("common.navbar.dashboard")} />
			</li>
			<li>
				<NavButton to="/swap" name={t("common.navbar.swap")} />
			</li>
			<li>
				<NavButton to="/mint" name={t("common.navbar.borrow")} />
			</li>
			<li>
				<NavButton to="/savings" name={t("common.navbar.savings")} />
			</li>
			<li>
				<NavButton to="/equity" name={t("common.navbar.equity")} />
			</li>
		</>
	);
}

export default function Navbar() {
	const [isNavBarOpen, setIsNavBarOpen] = useState(false);

	return (
		<div className="fixed top-0 left-0 right-0 z-20">
			<div>
				<header className="w-full h-16 px-5 lg:px-10 bg-white border-b border-menu-separator bg-menu-back backdrop-blur justify-between items-center inline-flex">
					<div className="h-9 justify-start items-center gap-6 inline-flex">
						<Link className="w-[120px] flex items-center justify-center" href={CONFIG.landing}>
							<div className="relative">
								<Image src="/assets/dEuro-Logo.svg" alt="Logo" width={120} height={31} priority />
							</div>
						</Link>

						<ul className={`justify-left hidden flex-1 gap-2 2md:flex lg:gap-3`}>
							<NavItems />
						</ul>
					</div>
					<div className="flex flex-1 justify-end items-center max-2md:pr-4 sm:gap-4">
						<WalletConnect />
						<div className="hidden 2md:block flex items-center">
							<GlobalPreferences />
						</div>
					</div>
					<div className="2md:hidden">
						<button onClick={() => setIsNavBarOpen(!isNavBarOpen)} className="cursor-pointer flex items-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								className="w-8 h-8"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
							</svg>
						</button>
					</div>
				</header>

				<aside className="flex 2md:hidden">
					<div className="flex items-center 2md:block">
						<label className="absolute z-20 cursor-pointer px-3 py-6 right-0 2md:right-4" htmlFor="ss-mobile-menu">
							<input className="peer hidden" type="checkbox" id="ss-mobile-menu" />

							<div className="hidden peer-checked:block">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</div>
							<div
								className={`fixed inset-0 h-screen w-full bg-black/70 backdrop-blur-sm ${
									isNavBarOpen ? "block" : "hidden"
								}`}
								onClick={() => setIsNavBarOpen(false)}
							></div>
							<div
								className={`fixed top-0 right-0 h-screen w-64 overflow-y-auto overscroll-y-auto transition-transform duration-200 ${
									isNavBarOpen ? "translate-x-0" : "translate-x-full"
								}`}
							>
								<div className="min-h-full w-full bg-white rounded-l-xl border border-borders-primary backdrop-blur px-6 pt-12 shadow-xl relative">
									<div className="absolute top-4 left-[24px]">
										<LanguageSelectorDropdown />
									</div>
									<button className="absolute top-4 right-4" onClick={() => setIsNavBarOpen(false)}>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											className="w-8 h-8"
										>
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
									<menu
										className="grid grid-cols-1 gap-3 mt-4 place-content-stretch"
										onClick={() => setIsNavBarOpen(false)}
									>
										<NavItems />
									</menu>
								</div>
							</div>
						</label>
					</div>
				</aside>
			</div>
		</div>
	);
}
