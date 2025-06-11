import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";

interface Props {
	chain: string;
	size?: number;
}

export default function ChainLogo({ chain, size = 8 }: Props) {
	const [imgExist, setImgExist] = useState(true);
	const [src, setSrc] = useState(`/coin/${chain?.toLowerCase()}.svg`);
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
		setSrc(`/chain/${chain?.toLowerCase()}.svg`);
		setImgExist(true);
	}, [chain]);

	return imgExist ? (
		<picture className=" relative">
			<img src={src} className={`w-${size} h-${size} rounded-full`} alt="token-logo" onError={onImageError} />
		</picture>
	) : (
		<FontAwesomeIcon icon={faCircleQuestion} className={`w-${size} h-${size} mr-2`} />
	);
}
