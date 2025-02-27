import { useState } from "react";
import Link from "next/link";
import WalletConnect from "./WalletConnect";
import NavButton from "./NavButton";
import { useIsMainnet } from "@hooks";
import { CONFIG } from "../../app.config";
import { GlobalPreferences } from "./GlobalPreferences";
import { useTranslation } from "next-i18next";

export function NavItems() {
	const isMainet = useIsMainnet();
	const { t } = useTranslation();

	return (
		<>
			<li className="inline-block sm:hidden">
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
			<li className={`${localStorage.getItem('dev-deuro') ? 'block' : 'hidden'} border border-red-500`}>
				<NavButton to="/dev" name="dev" />
			</li>
		</>
	);
}

export default function Navbar() {
	const [isNavBarOpen, setIsNavBarOpen] = useState(false);
	const { t } = useTranslation();

	return (
		<div className="fixed top-0 left-0 right-0 z-20">
			<div className="bg-yellow-500 text-black text-center font-bold text-sm md:text-base">{t("common.navbar.not_live")}</div>
			<div>
				<header className="w-full h-16 px-5 md:px-10 bg-white border-b border-menu-separator bg-menu-back backdrop-blur justify-between items-center inline-flex">
					<div className="h-9 justify-start items-center gap-6 inline-flex">
						<Link className="w-8 h-8 justify-center items-center inline-flex" href={CONFIG.landing}>
							<div className="w-8 h-8 relative flex-col justify-start items-start flex overflow-hidden">
								<picture className="w-8 h-8 relative">
									<img src="/coin/logo.png" alt="Logo" />
								</picture>
							</div>
						</Link>

						<ul className={`justify-left hidden flex-1 gap-2 md:flex lg:gap-3`}>
							<NavItems />
						</ul>
					</div>
					<div className="flex flex-1 justify-end items-center max-md:pr-4 sm:gap-4">
						<WalletConnect />
						<div className="hidden md:block flex items-center">
							<GlobalPreferences />
						</div>
					</div>
					<div className="md:hidden">
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

				<aside className="flex md:hidden">
					<div className="flex items-center md:block">
						<label className="absolute z-20 cursor-pointer px-3 py-6 right-0 md:right-4" htmlFor="ss-mobile-menu">
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
										className="grid grid-cols-1 gap-3 mt-1 place-content-stretch"
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
