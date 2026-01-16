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

            // Determine base path - get the directory where index.html is located
            // Adobe Express serves add-ons from a path like: /{testId}/index.html
            const currentUrl = new URL(window.location.href);
            const pathname = currentUrl.pathname;
            // Extract the base path (everything before index.html)
            const basePathFromUrl = pathname.substring(0, pathname.lastIndexOf('/'));
            const testFileName = "stress-test-1.jpg";
            
            // Build possible paths - account for testId in URL path
            const possibleBasePaths = [
                // Relative to current HTML file location (includes testId path)
                `${currentUrl.origin}${basePathFromUrl}/demo-assets`,
                // Direct path from origin (no testId)
                `${window.location.origin}/demo-assets`,
                // Relative path variations
                `./demo-assets`,
                `demo-assets`,
                // Try with trailing slashes
                `${currentUrl.origin}${basePathFromUrl}/demo-assets/`,
                `${window.location.origin}/demo-assets/`,
            ];

            console.log("[UI] Testing possible base paths:", possibleBasePaths);

            let workingBasePath: string | null = null;
            
            // Test first image to find working path
            for (const basePath of possibleBasePaths) {
                const testPath = `${basePath.replace(/\/$/, "")}/${testFileName}`;
                try {
                    console.log(`[UI] Testing path: ${testPath}`);
                    const testResponse = await fetch(testPath, {
                        method: 'GET',
                        mode: 'cors',
                        credentials: 'omit'
                    });
                    if (testResponse.ok) {
                        const testBlob = await testResponse.blob();
                        if (testBlob.size > 0) {
                            workingBasePath = basePath.replace(/\/$/, "");
                            console.log(`[UI] Found working base path: ${workingBasePath}`);
                            break;
                        }
                    } else {
                        console.log(`[UI] Path ${testPath} returned status: ${testResponse.status}`);
                    }
                } catch (error) {
                    console.log(`[UI] Path ${testPath} failed:`, error);
                }
            }

            if (!workingBasePath) {
                throw new Error(`Could not find demo-assets folder. Current URL: ${window.location.href}. Tried paths: ${possibleBasePaths.join(", ")}. Please ensure the dev server is running and has copied the public/demo-assets folder to the dist directory.`);
            }

            // Fetch all available images from demo-assets folder (try 1-50, but accept whatever is available)
            const imagePromises: Promise<ImageAsset | null>[] = [];
            const failedFetches: string[] = [];
            
            for (let i = 1; i <= 50; i++) {
                const fileName = `stress-test-${i}.jpg`;
                const imagePath = `${workingBasePath}/${fileName}`;

                const imagePromise = fetch(imagePath, {
                    method: 'GET',
                    mode: 'cors',
                    credentials: 'omit',
                    cache: 'no-cache'
                })
                    .then(async (response) => {
                        if (!response.ok) {
                            if (response.status === 404) {
                                // File doesn't exist, which is okay
                                return null;
                            }
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
                        // Only log errors that aren't network/CORS issues as warnings
                        if (error instanceof TypeError && error.message.includes('fetch')) {
                            // Likely CORS or network issue
                            console.warn(`[UI] Could not fetch ${fileName}: Network or CORS issue`);
                        } else {
                            console.error(`[UI] Error fetching ${fileName}:`, error);
                        }
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
