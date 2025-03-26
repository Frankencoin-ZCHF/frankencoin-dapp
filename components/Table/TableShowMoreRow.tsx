export const TableShowMoreRow = ({ onShowMoreClick, children }: { onShowMoreClick: () => void, children: React.ReactNode }) => (
	<button
		onClick={onShowMoreClick}
		className="h-12 px-8 py-3 bg-layout-primary hover:bg-table-row-hover rounded-b-xl border-t border-borders-primary flex-col justify-center items-start gap-2.5 inline-flex"
	>
		<div className="self-stretch justify-center items-center inline-flex">
			<div className="justify-start items-center gap-1 flex">
				{children}
			</div>
		</div>
	</button>
);