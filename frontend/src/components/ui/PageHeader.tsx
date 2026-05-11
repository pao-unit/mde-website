import type { StackProps } from "@chakra-ui/react";
import { Flex, Heading, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface PageHeaderProps extends Omit<StackProps, "title"> {
	eyebrow?: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	meta?: ReactNode;
	actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, meta, actions, ...stackProps }: PageHeaderProps) {
	return (
		<Stack gap={4} {...stackProps}>
			<Flex
				gap={5}
				align={{ base: "stretch", md: "flex-start" }}
				justify="space-between"
				direction={{ base: "column", md: "row" }}
			>
				<Stack gap={2} minW={0} maxW="4xl">
					{eyebrow ? (
						<Text fontSize="sm" fontWeight="semibold" color="fg.muted" textTransform="uppercase">
							{eyebrow}
						</Text>
					) : null}
					<Heading as="h1" size="lg" color="fg">
						{title}
					</Heading>
					{description ? (
						<Text color="fg.muted" fontSize={{ base: "md", md: "lg" }}>
							{description}
						</Text>
					) : null}
					{meta}
				</Stack>
				{actions ? (
					<Flex gap={2} align="center" justify={{ base: "flex-start", md: "flex-end" }} shrink={0} wrap="wrap">
						{actions}
					</Flex>
				) : null}
			</Flex>
		</Stack>
	);
}
