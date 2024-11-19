import Link from "next/link";
import { SOCIAL } from "@utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faBook, faBookmark, faComments, faCodeCommit } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faTelegram, faXTwitter, faTwitter } from "@fortawesome/free-brands-svg-icons";
import { SubmitIssue } from "./LoadingScreen";
import { usePathname } from "next/navigation";
import { useIsMainnet } from "@hooks";

const DynamicDocs = (): string => {
	const p = usePathname();
	let link: string = SOCIAL.Docs;

	if (p === null) return link;

	if (p !== "/mint/create" && p.includes("/mint")) link += "/positions/clone";
	else if (p === "/mint/create") link += "/positions/open";
	else if (p.includes("/mypositions")) link += "/positions/adjust";
	else if (p.includes("/monitoring")) link += "/positions/auctions";
	else if (p.includes("/challenges")) link += "/positions/auctions";
	else if (p.includes("/equity")) link += "/pool-shares";
	else if (p.includes("/savings")) link += "/savings-todo";
	else if (p.includes("/governance")) link += "/governance";
	else if (p.includes("/swap")) link += "/swap";

	return link;
};

export default function Footer() {
	const isMainnet = useIsMainnet();

	return (
		<div className="md:flex max-md:grid-rows-2 max-md:justify-items-center md:px-12 pb-12 pt-6 bg-layout-footer text-layout-primary">
			<div className="flex-1 justify-start">
				<SubmitIssue />
			</div>

			<ul className="flex justify-end gap-8 max-md:pt-12">
				<li>
					<FooterButton link={DynamicDocs()} text="Doc" icon={faBook} />
				</li>
				<li>
					<FooterButton link={SOCIAL.SubStack} text="Blog" icon={faBookmark} />
				</li>
				<li>
					<FooterButton link={SOCIAL.Github_contract} text="Github" icon={faGithub} />
				</li>
				<li>
					<FooterButton link={SOCIAL.Forum} text="Forum" icon={faComments} />
				</li>
				<li>
					<FooterButton link={SOCIAL.Telegram} text="Telegram" icon={faTelegram} />
				</li>
				<li>
					<FooterButton link={SOCIAL.Twitter} text="Twitter" icon={faXTwitter} />
				</li>
			</ul>
		</div>
	);
}

interface ButtonProps {
	link: string;
	text: string;
	icon: IconProp;
}

const FooterButton = ({ link, text, icon }: ButtonProps) => {
	return (
		<Link href={link} target="_blank" rel="noreferrer" className="flex gap-1 hover:opacity-70">
			<FontAwesomeIcon icon={icon} className="w-6 h-6" />
		</Link>
	);
};
