import { Card, CardBody, Tab, Tabs } from "@nextui-org/react";

export function TabsContainer({
	tabs,
	selectedTab,
	onChange,
}: {
	tabs: {
		key: string;
		title: React.ReactNode;
		content: React.ReactNode;
	}[];
	selectedTab: string;
	onChange: (key: string) => void;
}) {
	return (
		<Card className="border border-neutral-200/50 dark:border-neutral-800/50">
			<CardBody className="p-0">
				<Tabs
					selectedKey={selectedTab}
					onSelectionChange={(key) => onChange(key.toString())}
					className="p-0"
					classNames={{
						tabList:
							"p-4 bg-neutral-50/50 dark:bg-neutral-800/50 border-b border-neutral-200/50 dark:border-neutral-800/50",
						cursor: "bg-primary",
						tab: "h-12 px-8",
						panel: "p-6",
					}}>
					{tabs.map(({ key, title, content }) => (
						<Tab key={key} title={title}>
							{content}
						</Tab>
					))}
				</Tabs>
			</CardBody>
		</Card>
	);
}
