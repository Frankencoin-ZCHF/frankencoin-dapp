import Link from "next/link";
import WalletConnect from "./WalletConnect";
import NavButton from "./NavButton";
import { CONFIG } from "../app.config";
import { useEffect, useRef, useState } from "react";
import { LAYOUT_CONFIGS, LayoutMode } from "../utils/layoutConfig";
import { useLayoutMode } from "../hooks/useLayoutMode";

function LayoutSwitcher({ mode, setLayoutMode }: { mode: LayoutMode; setLayoutMode: (m: LayoutMode) => void }) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	const current = LAYOUT_CONFIGS[mode];

	return (
		<div ref={ref} className="relative">
			<button
				onClick={() => setOpen((o) => !o)}
				className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-menu-separator hover:bg-card-body transition-colors"
			>
				<span>{current.icon}</span>
				<span>{current.label}</span>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
				>
					<path
						fillRule="evenodd"
						d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
						clipRule="evenodd"
					/>
				</svg>
			</button>

			{open && (
				<div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-menu-separator bg-menu-back shadow-lg overflow-hidden z-50">
					{(Object.keys(LAYOUT_CONFIGS) as LayoutMode[]).map((m) => {
						const cfg = LAYOUT_CONFIGS[m];
						return (
							<button
								key={m}
								onClick={() => {
									setLayoutMode(m);
									setOpen(false);
								}}
								className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors hover:bg-card-body ${
									mode === m ? "font-semibold" : ""
								}`}
							>
								<span>{cfg.icon}</span>
								<span>{cfg.label}</span>
								{mode === m && (
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
										className="w-4 h-4 ml-auto"
									>
										<path
											fillRule="evenodd"
											d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
											clipRule="evenodd"
										/>
									</svg>
								)}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}

function MobileLayoutSwitcher({ mode, setLayoutMode }: { mode: LayoutMode; setLayoutMode: (m: LayoutMode) => void }) {
	return (
		<div className="mb-4">
			<p className="text-xs uppercase tracking-wider text-gray-400 mb-2 px-1">Mode</p>
			<div className="grid grid-cols-3 gap-1">
				{(Object.keys(LAYOUT_CONFIGS) as LayoutMode[]).map((m) => {
					const cfg = LAYOUT_CONFIGS[m];
					return (
						<button
							key={m}
							onClick={() => setLayoutMode(m)}
							className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs transition-colors border ${
								mode === m
									? "border-menu-separator bg-card-body font-semibold"
									: "border-transparent hover:bg-card-body"
							}`}
						>
							<span className="text-base">{cfg.icon}</span>
							<span>{cfg.label}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}

export function NavItems({ mode }: { mode: LayoutMode }) {
	const routes = LAYOUT_CONFIGS[mode].routes;
	return (
		<>
			{routes.map((route) => (
				<li key={route.to}>
					<NavButton to={route.to} name={route.name} />
				</li>
			))}
		</>
	);
}

export default function Navbar() {
	const [isNavBarOpen, setIsNavBarOpen] = useState(false);
	const { mode, setLayoutMode } = useLayoutMode();

	return (
		<div className="fixed top-0 left-0 right-0 z-10 backdrop-blur border-b-2 border-menu-separator bg-menu-back">
			<header className="flex items-center md:py-4 px-4 md:gap-x-4 relative w-full">
				<Link className="pl-6 pr-4" href={CONFIG.landing}>
					<picture>
						<img className="h-9 transition" src="/coin/zchf.png" alt="Logo" />
					</picture>
				</Link>

				<ul className={`justify-left hidden flex-1 gap-2 md:flex lg:gap-3`}>
					<NavItems mode={mode} />
				</ul>

				<div className="hidden md:flex items-center gap-3 ml-auto">
					<LayoutSwitcher mode={mode} setLayoutMode={setLayoutMode} />
					<WalletConnect />
				</div>

				<div className="flex flex-1 justify-end items-center max-md:pr-4 md:hidden">
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
										<MobileLayoutSwitcher mode={mode} setLayoutMode={setLayoutMode} />
										<NavItems mode={mode} />
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
