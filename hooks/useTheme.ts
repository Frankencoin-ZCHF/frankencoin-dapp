import { useLocalStorage } from "./useLocalStorage";

export const useTheme = (): [string, React.Dispatch<string>] => {
	const [theme, setTheme] = useLocalStorage("theme");
	// Set default theme to light theme
	const currentTheme = theme == "light" ? "light" : "dark";
	return [currentTheme, setTheme];
};
