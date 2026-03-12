import Link from "next/link";
import WalletConnect from "./WalletConnect";
import NavButton from "./NavButton";
import { CONFIG } from "../app.config";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

const MAIN_ITEMS = [
	{ to: "/mint", name: "Borrow" },
	{ to: "/savings", name: "Earn" },
	{ to: "/equity", name: "Invest" },
];

const MORE_ITEMS = [
	{ to: "/transfer", name: "Transfer" },
	{ to: "/mypositions", name: "My Positions" },
	{ to: "/monitoring", name: "Monitoring" },
	{ to: "/governance", name: "Governance" },
];

const ALL_ITEMS = [...MAIN_ITEMS, ...MORE_ITEMS];

function MoreDropdown() {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const isActive = MORE_ITEMS.some((item) => router.pathname.includes(item.to));

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div ref={ref} className="relative">
			<button
				onClick={() => setOpen((v) => !v)}
				className={`flex items-center gap-1 md:btn md:btn-nav md:py-2 font-medium hover:bg-menu-hover hover:text-menu-text rounded-lg px-3 ${
					isActive ? "text-menu-textactive bg-menu-active font-semibold" : "text-menu-text"
				}`}
			>
				More
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
				>
					<path
						fillRule="evenodd"
						d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
						clipRule="evenodd"
					/>
				</svg>
			</button>
			{open && (
				<div className="absolute top-full right-0 t-0 mt-1 px-2 grid gap-1 rounded-lg bg-menu-back border border-menu-separator shadow-md py-1 z-50">
					{MORE_ITEMS.map((item) => (
						<div key={item.to} onClick={() => setOpen(false)}>
							<NavButton to={item.to} name={item.name} />
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export function NavItems() {
	return (
		<>
			{ALL_ITEMS.map((item) => (
				<li key={item.to}>
					<NavButton to={item.to} name={item.name} />
				</li>
			))}
		</>
	);
}

export default function Navbar() {
	const [isNavBarOpen, setIsNavBarOpen] = useState(false);

	return (
		<>
			<div className="fixed top-0 left-0 right-0 z-10 backdrop-blur border-b-2 border-menu-separator/80 bg-menu-back/80">
				<header className="grid grid-cols-[1fr,auto,1fr] items-center md:py-4 py-3 px-4 w-full">
					{/* Left: logo */}
					<div className="flex items-center md:pl-4">
						<Link href={CONFIG.landing}>
							<picture>
								<img className="h-9 transition" src="/coin/zchf.png" alt="Logo" />
							</picture>
						</Link>
					</div>

					{/* Center: desktop nav / mobile wallet */}
					<div className="flex justify-center">
						<ul className="hidden md:flex gap-2 lg:gap-3">
							{MAIN_ITEMS.map((item) => (
								<li key={item.to}>
									<NavButton to={item.to} name={item.name} />
								</li>
							))}
							<li>
								<MoreDropdown />
							</li>
						</ul>
						<div className="md:hidden">
							<WalletConnect />
						</div>
					</div>

					{/* Right: desktop wallet / mobile hamburger */}
					<div className="flex justify-end items-center">
						<div className="hidden md:flex">
							<WalletConnect />
						</div>
						<button onClick={() => setIsNavBarOpen(true)} className="md:hidden p-2 cursor-pointer flex items-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								className="w-7 h-7"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
							</svg>
						</button>
					</div>
				</header>
			</div>

			{/* Mobile sidebar */}
			<div
				className={`md:hidden fixed inset-0 z-20 h-screen w-full bg-black/70 backdrop-blur-sm transition-opacity ${
					isNavBarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
				}`}
				onClick={() => setIsNavBarOpen(false)}
			/>
			<div
				className={`md:hidden fixed top-0 right-0 z-30 h-screen w-64 overflow-y-auto transition-transform duration-200 ${
					isNavBarOpen ? "translate-x-0" : "translate-x-full"
				}`}
			>
				<div className="min-h-full w-full bg-menu-back backdrop-blur px-[16px] pt-[20px] relative">
					<button className="absolute top-0 right-0 p-6" onClick={() => setIsNavBarOpen(false)}>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
					<menu className="grid grid-cols-1 gap-2 mt-12" onClick={() => setIsNavBarOpen(false)}>
						<NavItems />
					</menu>
				</div>
			</div>
		</>
	);
}
