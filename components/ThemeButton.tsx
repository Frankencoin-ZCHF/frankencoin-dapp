import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTheme } from "@hooks";
import { useEffect } from "react";

export default function ThemeButton() {
  const [theme, setTheme] = useTheme();

  useEffect(() => {
    if (theme == "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const onToggleTheme = () => {
    const newTheme = theme == "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  return (
    <div
      className={`w-7 md:mr-8 ${theme == "light" && "p-1"} cursor-pointer`}
      onClick={onToggleTheme}
    >
      <FontAwesomeIcon icon={theme == "dark" ? faSun : faMoon} />
    </div>
  );
}
