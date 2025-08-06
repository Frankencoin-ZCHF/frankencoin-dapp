import Link from "next/link";
import WalletConnect from "./WalletConnect";
import NavButton from "./NavButton";
import { CONFIG } from "../app.config";
import { useState } from "react";

export function NavItems() {
	return (
		<>
			<li>
				<NavButton to="/swap" name="Swap" />
			</li>
			<li>
				<NavButton to="/mint" name="Borrow" />
			</li>
			<li>
				<NavButton to="/transfer" name="Transfer" />
			</li>
			<li>
				<NavButton to="/mypositions" name="My Positions" />
			</li>
			<li>
				<NavButton to="/monitoring" name="Monitoring" />
			</li>
			<li>
				<NavButton to="/savings" name="Savings" />
			</li>
			<li>
				<NavButton to="/equity" name="Equity" />
			</li>
			<li>
				<NavButton to="/governance" name="Governance" />
			</li>
		</>
	);
}

export default function Navbar() {
	const [isNavBarOpen, setIsNavBarOpen] = useState(false);

	return (
		<div className="fixed top-0 left-0 right-0 z-10 backdrop-blur border-b-2 border-menu-separator bg-menu-back">
			<header className="flex items-center md:py-4 px-4 md:gap-x-4 relative w-full">
				<Link className="pl-6 pr-4" href={CONFIG.landing}>
					<picture>
						<img className="h-9 transition" src="/coin/zchf.png" alt="Logo" />
					</picture>
				</Link>

				<ul className={`justify-left hidden flex-1 gap-2 md:flex lg:gap-3`}>
					<NavItems />
				</ul>

				<div className="flex flex-1 justify-end items-center max-md:pr-4">
					<WalletConnect />
				</div>

				<div className="md:hidden">
					<button onClick={() => setIsNavBarOpen(!isNavBarOpen)} className="-mr-4 p-5 cursor-pointer flex items-center">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</button>
				</div>

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
								<div className="min-h-full w-full bg-menu-back rounded-l-xl backdrop-blur px-[16px] pt-[20px] shadow-xl relative">
									<button className="absolute top-0 right-0 p-6" onClick={() => setIsNavBarOpen(false)}>
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
									<menu className="grid grid-cols-1 gap-2 mt-12" onClick={() => setIsNavBarOpen(false)}>
										<NavItems />
									</menu>
								</div>
							</div>
						</label>
					</div>
				</aside>
			</header>
		</div>
	);
}
