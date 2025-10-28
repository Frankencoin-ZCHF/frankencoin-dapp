import { wrapFetchWithPayment } from "x402-fetch";
import { WAGMI_CONFIG } from "../app.config";
import AppButton from "@components/AppButton";

export default function X402() {
	const handleClick = async () => {
		const fetchWithPayment = wrapFetchWithPayment(fetch, WAGMI_CONFIG);

		const response = await fetchWithPayment("http://localhost:8080", {
			method: "GET",
		});

		console.log(await response.json());
	};

	return (
		<div className="">
			<AppButton onClick={handleClick}>Click</AppButton>
		</div>
	);
}
