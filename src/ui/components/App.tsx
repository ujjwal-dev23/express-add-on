// To support: system="express" scale="medium" color="light"
// import these spectrum web components modules:
import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";

// To learn more about using "swc-react" visit:
// https://opensource.adobe.com/spectrum-web-components/using-swc-react/
import { Button } from "@swc-react/button";
import { Theme } from "@swc-react/theme";
import React from "react";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import "./App.css";

import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

const App = ({ addOnUISdk, sandboxProxy }: { addOnUISdk: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {
    function handleClick() {
        sandboxProxy.createRectangle();
    }

    async function handleTestImport() {
        try {
            const count = 50;
            console.log(`Starting stress test import (${count} images) using local assets...`);

            const imageAssets = [];
            for (let i = 0; i < count; i++) {
                const filename = `stress-test-${i + 1}.jpg`;
                const url = `./demo-assets/${filename}`;

                console.log(`[UI] Fetching local asset ${i + 1}/${count}: ${filename}`);

                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error("Local file not found");
                    const blob = await response.blob();
                    imageAssets.push({
                        blob,
                        name: filename
                    });
                } catch (e) {
                    console.warn(`[UI] Local asset ${filename} failed, attempting network fallback...`);
                    const fallbackUrl = `https://picsum.photos/seed/express-stress-${i}/800/600`;
                    const response = await fetch(fallbackUrl);
                    const blob = await response.blob();
                    imageAssets.push({
                        blob,
                        name: `fb-${filename}`
                    });
                }
            }

            console.log(`Ready with ${imageAssets.length} images. Sending to sandbox...`);
            await sandboxProxy.importImages(imageAssets);
            console.log("Stress test import successful!");
        } catch (error) {
            console.error("Stress test failed:", error);
        }
    }

    return (
        // Please note that the below "<Theme>" component does not react to theme changes in Express.
        // You may use "addOnUISdk.app.ui.theme" to get the current theme and react accordingly.
        <Theme system="express" scale="medium" color="light">
            <div className="container" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <Button onClick={handleClick}>
                    Create Rectangle
                </Button>

                <hr style={{ width: "100%", borderTop: "1px solid #ddd" }} />

                <div style={{ padding: "8px", border: "1px dashed #999", borderRadius: "4px" }}>
                    <p style={{ fontSize: "12px", margin: "0 0 8px 0" }}>Developer Test Tool:</p>
                    <Button variant="secondary" onClick={handleTestImport}>
                        Test Backend (Import 50 Images)
                    </Button>
                </div>
            </div>
        </Theme>
    );
};

export default App;
