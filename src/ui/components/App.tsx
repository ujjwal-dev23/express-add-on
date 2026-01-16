// To support: system="express" scale="medium" color="light"
// import these spectrum web components modules:
import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";

// To learn more about using "swc-react" visit:
// https://opensource.adobe.com/spectrum-web-components/using-swc-react/
import { Theme } from "@swc-react/theme";
import React from "react";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import "./App.css";

import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { ImportTool } from "../../sandbox/features/import/ui/ImportTool";
import { CanvasFittingTool } from "../../sandbox/features/canvas-fitting/ui/CanvasFittingTool";

const App = ({ addOnUISdk, sandboxProxy }: { addOnUISdk: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {
    return (
        <Theme system="express" scale="medium" color="light">
            <div className="container" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <ImportTool sandboxProxy={sandboxProxy} addOnUISdk={addOnUISdk} />
                <CanvasFittingTool sandboxProxy={sandboxProxy} />
            </div>
        </Theme>
    );
};

export default App;
