import { Container, Flex, Text } from "@chakra-ui/react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Header } from "../components/Header";

export const Route = createRootRoute({
	component: Root,
	errorComponent: () => (
		<Container maxW="4xl" py={12}>
			<Text fontSize="lg" fontWeight="semibold">
				Something went wrong while rendering this page.
			</Text>
		</Container>
	),
});

function Root() {
	return (
		<Flex h="100dvh" bg="gray.50" overflow="hidden" direction="column">
			<Header />
			<Flex flex="1" overflow="hidden" minH={0} direction="column">
				<Outlet />
			</Flex>
			<TanStackDevtools
				config={{
					position: "bottom-left",
				}}
				plugins={[
					{
						name: "Tanstack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
					{
						name: "Tanstack Query",
						render: <ReactQueryDevtoolsPanel />,
					},
				]}
			/>
		</Flex>
	);
}
