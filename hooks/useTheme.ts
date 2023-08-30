import { useLocalStorage } from "./useLocalStorage";

export const useTheme = (): [string, React.Dispatch<string>] => {
  const [theme, setTheme] = useLocalStorage("theme");
  // Set default theme to light theme
  const currentTheme = theme == "dark" ? "dark" : "light";
  return [currentTheme, setTheme];
};
