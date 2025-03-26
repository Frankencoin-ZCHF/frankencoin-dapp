import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { useEffect, useState } from "react";

export const useTvl = <T>(options?: AxiosRequestConfig) => {
	const url = "https://api.llama.fi/tvl/deuro";
	const [data, setData] = useState<T | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<any>(null);

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);

			try {
				const response: AxiosResponse<T> = await axios(url, options);
				setData(response.data);
			} catch (error) {
				setError(error);
			}

			setIsLoading(false);
		};

		fetchData();
	}, [options]);

	return { data, isLoading, error };
};
