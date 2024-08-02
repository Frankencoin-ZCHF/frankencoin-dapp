import React from "react";

interface Props {
	children: React.ReactElement[] | React.ReactElement;
}

export default function TableBody({ children }: Props) {
	return <div className="grid grid-cols-1">{children}</div>;
}
