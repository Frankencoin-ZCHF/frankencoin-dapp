import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { SOCIAL } from "../utils/constant";
import { version } from "../package.json";
import { faCodeCommit } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

export default function LoadingScreen() {
	return (
		<>
			<div className="flex items-center justify-center gap-4 h-screen">
				<div className="flex flex-col items-center gap-8">
					<div className="flex flex-row items-center -mt-20">
						<picture>
							<img className="h-10 mr-4" src="/coin/zchf.png" alt="Logo" />
						</picture>
						<h1>Frankencoin is loading...</h1>
					</div>

					<div className="absolute bottom-[20%] w-full flex justify-center">
						<h1 className="px-8 text-center max-w-2xl">
							This website uses third-party cookies, and certain features may not function properly if you choose to block
							them.
						</h1>
					</div>

					<div className="absolute bottom-0 bg-layout-footer w-full pb-8 pt-8 grid place-items-center">
						<SubmitIssue />
					</div>
				</div>
			</div>
		</>
	);
}

export function SubmitIssue() {
	const isTestnet = process.env.NEXT_PUBLIC_PROFILE == "testnet";

	return (
		<ul className="flex items-center gap-8 text-layout-primary">
			<li>
				<FooterButton link={SOCIAL.Github_dapp_new_issue} text="Submit an Issue" icon={faGithub} />
			</li>
			<li>
				<FooterButton
					link={SOCIAL.Github_dapp}
					text={`${version} - ${isTestnet ? "Development" : "Production"}`}
					icon={faCodeCommit}
				/>
			</li>
		</ul>
	);
}

interface ButtonProps {
	link: string;
	text: string;
	icon: IconProp;
}

const FooterButton = ({ link, text, icon }: ButtonProps) => {
	return (
		<Link href={link} target="_blank" rel="noreferrer" className="flex gap-2 hover:opacity-70">
			<FontAwesomeIcon icon={icon} className="w-6 h-6" />
			<div className="font-semibold">{text}</div>
		</Link>
	);
};
