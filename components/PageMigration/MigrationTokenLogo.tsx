import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";

interface Props {
	logoURI: string;
	symbol: string;
	size?: number;
}

export default function MigrationTokenLogo({ logoURI, symbol, size = 8 }: Props) {
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		setFailed(false);
	}, [logoURI]);

	return failed || !logoURI ? (
		<FontAwesomeIcon icon={faCircleQuestion} className={`w-${size} h-${size} text-text-secondary`} />
	) : (
		<img src={logoURI} alt={symbol} className={`w-${size} h-${size} rounded-full`} onError={() => setFailed(true)} />
	);
}
