import { useEffect, useState } from "react";
import { CONFIG } from "../app.config";
import { Loading } from "../components/LoadingScreen";

export function useServiceStatus(): Loading[] {
	const [apiStatus, setApiStatus] = useState(false);
	const [ponderStatus, setPonderStatus] = useState(false);

	useEffect(() => {
		fetch(`${CONFIG.api}/ecosystem/coinmarketcap/totalsupply`)
			.then((res) => setApiStatus(res.ok))
			.catch(() => setApiStatus(false));

		fetch(`${CONFIG.ponder}/status`)
			.then((res) => setPonderStatus(res.ok))
			.catch(() => setPonderStatus(false));
	}, []);

	return [
		{ id: "ponder", title: "Indexer", isLoaded: ponderStatus },
		{ id: "api", title: "Api", isLoaded: apiStatus },
	];
}
