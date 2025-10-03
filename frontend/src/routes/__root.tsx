import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { Box3D } from "../components/Box3D";
import { Header } from "../components/Header";
import LinePlot from "../components/LinePlot";
import Scene from "../components/Scene";
import { $api } from "../libs/api";

export const Route = createRootRoute({
	component: Root,
});

function Root() {
	const { data: data1, isSuccess: isSuccess1 } = $api.useQuery(
		"put",
		"/api/items/{item_id}",
		{
			params: { path: { item_id: 1 }, query: { skip_id_check: false } },
			body: { id: 2, name: "hoge", description: "fuga" },
		},
	);
	console.log(data1);
	console.log(isSuccess1);
	const { data: data2, isSuccess: isSuccess2 } = $api.useQuery(
		"post",
		"/api/test-run",
	);
	console.log(data2);
	console.log(isSuccess2);
	return (
		<>
			<Header />
			<LinePlot data={[1, 3, 2, 5, 4, 6, 8, 7, 9]} />
			<Scene>
				<Box3D position={[-1.2, 0, 0]} />
				<Box3D position={[1.2, 0, 0]} />
			</Scene>
			<Outlet />
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
		</>
	);
}
