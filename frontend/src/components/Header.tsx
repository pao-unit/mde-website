import { Box, Container, Flex, Link } from "@chakra-ui/react";
import { Link as RouterLink } from "@tanstack/react-router";

export function Header() {
	return (
		<Box as="header" borderBottomWidth="1px" borderColor="gray.200" bg="gray.50">
			<Container maxW="6xl" py={4}>
				<Flex align="center" justify="space-between" gap={6}>
					<Link asChild fontSize="xl" fontWeight="semibold" color="fg">
						<RouterLink to="/">Manifold Dimension Expansion</RouterLink>
					</Link>
					<Flex as="nav" gap={6} fontWeight="medium">
						<Link asChild color="fg.muted">
							<RouterLink to="/">Dashboard</RouterLink>
						</Link>
						<Link asChild color="fg.muted">
							<RouterLink to="/projects/new">New Project</RouterLink>
						</Link>
					</Flex>
				</Flex>
			</Container>
		</Box>
	);
}
