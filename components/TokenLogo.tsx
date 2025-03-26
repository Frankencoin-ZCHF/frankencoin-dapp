import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";

interface Props {
	currency: string;
	size?: number;
	chain?: "mainnet" | "polygon" | "arbitrum" | "optimism";
}

export default function TokenLogo({ currency, size = 8, chain }: Props) {
	const [imgExist, setImgExist] = useState(true);
	const [src, setSrc] = useState(`/coin/${currency?.toLowerCase()}.svg`);
	const onImageError = (e: any) => {
		const src = e.target.src;
		if (src.includes(".svg")) {
			setSrc(src.replace(".svg", ".png"));
		} else if (src.includes(".png")) {
			setSrc(src.replace(".png", ".jpeg"));
		} else {
			setImgExist(false);
		}
	};

	useEffect(() => {
		setSrc(`/coin/${currency?.toLowerCase()}.svg`);
		setImgExist(true);
	}, [currency]);

	return imgExist ? (
		<picture className=" relative">
			<img src={src} className={`w-${size} h-${size} rounded-full`} alt="token-logo" onError={onImageError} />
			{chain && (
				<picture className="absolute bottom-0 right-0 p-px rounded-full bg-slate-800">
					<img src={`/chain/${chain}.svg`} className={`w-3 h-3 rounded-full`} alt="token-logo" onError={onImageError} />
				</picture>
			)}
		</picture>
	) : (
		<FontAwesomeIcon icon={faCircleQuestion} className={`w-${size} h-${size}`} />
	);
}
