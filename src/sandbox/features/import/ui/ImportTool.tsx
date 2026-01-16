import React, { useState } from "react";
import { Button } from "@swc-react/button";
import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { DocumentSandboxApi } from "../../../../models/DocumentSandboxApi";
import { ImageAsset } from "../../../../types";

interface ImportToolProps {
    sandboxProxy: DocumentSandboxApi;
    addOnUISdk: AddOnSDKAPI;
}

export const ImportTool: React.FC<ImportToolProps> = ({ sandboxProxy, addOnUISdk }) => {
    const [isImporting, setIsImporting] = useState(false);

    const handleDemoImport = async () => {
        try {
            setIsImporting(true);
            console.log("[UI] Starting demo import of 50 images...");
            console.log(`[UI] Current location: ${window.location.href}`);
            console.log(`[UI] Current pathname: ${window.location.pathname}`);
            console.log(`[UI] Current origin: ${window.location.origin}`);

            // Determine base path - try to find the correct path by testing one file first
            const testFileName = "stress-test-1.jpg";
            const possibleBasePaths = [
                // Relative paths
                new URL("demo-assets", window.location.href).href.replace(/\/$/, ""),
                new URL("./demo-assets", window.location.href).href.replace(/\/$/, ""),
                // Absolute paths
                `${window.location.origin}/demo-assets`,
                `${window.location.protocol}//${window.location.host}/demo-assets`,
                // Path based on current directory
                window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/demo-assets',
            ];

            console.log("[UI] Testing possible base paths:", possibleBasePaths);

            let workingBasePath: string | null = null;
            
            // Test first image to find working path
            for (const basePath of possibleBasePaths) {
                const testPath = `${basePath}/${testFileName}`;
                try {
                    console.log(`[UI] Testing path: ${testPath}`);
                    const testResponse = await fetch(testPath);
                    if (testResponse.ok) {
                        const testBlob = await testResponse.blob();
                        if (testBlob.size > 0) {
                            workingBasePath = basePath;
                            console.log(`[UI] Found working base path: ${workingBasePath}`);
                            break;
                        }
                    }
                } catch (error) {
                    console.log(`[UI] Path ${testPath} failed:`, error);
                }
            }

            if (!workingBasePath) {
                throw new Error(`Could not find demo-assets folder. Tried paths: ${possibleBasePaths.join(", ")}. Please ensure the dev server has copied the public/demo-assets folder to the dist directory.`);
            }

            // Fetch all 50 images from demo-assets folder
            const imagePromises: Promise<ImageAsset | null>[] = [];
            const failedFetches: string[] = [];
            
            for (let i = 1; i <= 50; i++) {
                const fileName = `stress-test-${i}.jpg`;
                const imagePath = `${workingBasePath}/${fileName}`;

                const imagePromise = fetch(imagePath)
                    .then(async (response) => {
                        if (!response.ok) {
                            console.warn(`[UI] Failed to fetch ${fileName}: ${response.status} ${response.statusText}`);
                            return null;
                        }
                        const blob = await response.blob();
                        if (blob.size === 0) {
                            console.warn(`[UI] Empty blob for ${fileName}`);
                            return null;
                        }
                        console.log(`[UI] Successfully loaded: ${fileName} (${blob.size} bytes)`);
                        return {
                            blob,
                            name: fileName
                        } as ImageAsset;
                    })
                    .catch((error) => {
                        console.error(`[UI] Error fetching ${fileName}:`, error);
                        failedFetches.push(fileName);
                        return null;
                    });
                
                imagePromises.push(imagePromise);
            }

            // Wait for all images to load
            const imageAssets = (await Promise.all(imagePromises)).filter(
                (asset): asset is ImageAsset => asset !== null
            );

            console.log(`[UI] Successfully loaded ${imageAssets.length}/50 images`);
            if (failedFetches.length > 0) {
                console.warn(`[UI] Failed to load ${failedFetches.length} images:`, failedFetches.slice(0, 10));
            }

            if (imageAssets.length === 0) {
                throw new Error(`No images were successfully loaded. Working base path was: ${workingBasePath}`);
            }

            // Import images via sandbox
            await sandboxProxy.importImages(imageAssets);
            console.log(`[UI] Demo import complete. ${imageAssets.length} images imported.`);
        } catch (error) {
            console.error("[UI] Demo import failed:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("[UI] Error details:", errorMessage);
            // Note: alert() doesn't work in sandboxed iframe, so just log to console
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>Demo Import</h3>
            <Button 
                variant="cta" 
                onClick={isImporting ? undefined : handleDemoImport}
                style={{ opacity: isImporting ? 0.5 : 1, pointerEvents: isImporting ? "none" : "auto" }}
            >
                {isImporting ? "Importing 50 Images..." : "Import 50 Demo Images"}
            </Button>
        </div>
    );
};
