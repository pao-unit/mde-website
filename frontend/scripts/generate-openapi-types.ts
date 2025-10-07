import fs from "node:fs";
import path from "node:path";
import openapiTS, { astToString } from "openapi-typescript";
import ts from "typescript";

const BLOB = ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("Blob")); // `Blob`
const NULL = ts.factory.createLiteralTypeNode(ts.factory.createNull()); // `null`

const ast = await openapiTS(new URL("http://localhost:8000/openapi.json"), {
	transform(schemaObject, _metadata) {
		if (schemaObject.format === "binary") {
			return schemaObject.nullable ? ts.factory.createUnionTypeNode([BLOB, NULL]) : BLOB;
		}
	},
});
const contents = astToString(ast);

const out = path.resolve(import.meta.dirname, "../src/libs/api/openapi.gen.ts");
if (fs.existsSync(out)) {
	fs.rmSync(out);
}

fs.writeFileSync(out, contents);
