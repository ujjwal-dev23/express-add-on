import React, { useState } from "react";
import { Button } from "@swc-react/button";
import { DocumentSandboxApi } from "../../../../models/DocumentSandboxApi";
import { FitMode } from "../../../../types";

interface CanvasFittingToolProps {
    sandboxProxy: DocumentSandboxApi;
}

export const CanvasFittingTool: React.FC<CanvasFittingToolProps> = ({ sandboxProxy }) => {
    const [isApplying, setIsApplying] = useState(false);
    const [selectedMode, setSelectedMode] = useState<FitMode>("contain");

    const handleFitToCanvas = async (fitMode: FitMode) => {
        try {
            setIsApplying(true);
            console.log(`[UI] Applying fit mode: ${fitMode}`);
            await sandboxProxy.fitToCanvas(fitMode);
            console.log(`[UI] Fit to canvas complete: ${fitMode}`);
        } catch (error) {
            console.error("[UI] Fit to canvas failed:", error);
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>Canvas Fitting</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: 500 }}>
                    Fit Mode:
                </label>
                <select 
                    value={selectedMode} 
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedMode(e.target.value as FitMode)}
                    disabled={isApplying}
                    style={{ 
                        padding: "8px", 
                        fontSize: "14px",
                        border: "1px solid #ccc",
                        borderRadius: "4px"
                    }}
                >
                    <option value="contain">Contain (Fit within canvas)</option>
                    <option value="fill">Fill (Cover entire canvas)</option>
                </select>
            </div>

            <Button 
                variant="cta" 
                onClick={() => handleFitToCanvas(selectedMode)}
                style={{ 
                    opacity: isApplying ? 0.5 : 1, 
                    pointerEvents: isApplying ? "none" : "auto",
                    marginTop: "8px"
                }}
            >
                {isApplying ? "Applying..." : `Apply ${selectedMode === "fill" ? "Fill" : "Contain"}`}
            </Button>
        </div>
    );
};
