import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";

interface Props {
  currency: string;
  size?: number;
}

export default function TokenLogo({ currency, size = 8 }: Props) {
  const [imgExist, setImgExist] = useState(true);
  const [src, setSrc] = useState(`/coin/${currency?.toLowerCase()}.svg`);
  const onImageError = (e: any) => {
    const src = e.target.src;
    if (src.includes(".svg")) {
      setSrc(src.replace(".svg", ".png"));
    } else if (src.includes(".png")) {
      setImgExist(false);
    }
  };

  useEffect(() => {
    setImgExist(true);
  }, [currency]);

  return imgExist ? (
    <picture className="mr-2">
      <img
        src={src}
        className={`w-${size} h-${size} rounded-full`}
        alt="token-logo"
        onError={onImageError}
      />
    </picture>
  ) : (
    <FontAwesomeIcon
      icon={faCircleQuestion}
      className={`w-${size} h-${size} mr-2`}
    />
  );
}
