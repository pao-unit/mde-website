import type { BoxProps } from "@chakra-ui/react";
import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface PanelProps extends Omit<BoxProps, "title"> {
	eyebrow?: ReactNode;
	title?: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
	footer?: ReactNode;
	children?: ReactNode;
}

export function Panel({ eyebrow, title, description, actions, footer, children, ...boxProps }: PanelProps) {
	const hasHeader = Boolean(eyebrow || title || description || actions);

	return (
		<Box
			bg="white"
			borderWidth="1px"
			borderColor="gray.200"
			borderRadius="8px"
			boxShadow="xs"
			p={{ base: 4, md: 6 }}
			{...boxProps}
		>
			<Stack gap={5}>
				{hasHeader ? (
					<Flex
						gap={4}
						align={{ base: "stretch", md: "flex-start" }}
						justify="space-between"
						direction={{ base: "column", md: "row" }}
					>
						<Stack gap={1} minW={0}>
							{eyebrow ? (
								<Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase">
									{eyebrow}
								</Text>
							) : null}
							{title ? (
								<Text as="h2" fontSize="lg" fontWeight="semibold" color="fg">
									{title}
								</Text>
							) : null}
							{description ? <Text color="fg.muted">{description}</Text> : null}
						</Stack>
						{actions ? (
							<Flex gap={2} align="center" justify={{ base: "flex-start", md: "flex-end" }} shrink={0} wrap="wrap">
								{actions}
							</Flex>
						) : null}
					</Flex>
				) : null}
				{children}
				{footer ? (
					<Box borderTopWidth="1px" borderColor="gray.100" pt={4}>
						{footer}
					</Box>
				) : null}
			</Stack>
		</Box>
	);
}
