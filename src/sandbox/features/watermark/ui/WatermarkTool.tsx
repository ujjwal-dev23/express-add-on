/// <reference lib="dom" />
import React from "react";
import { Button } from "@swc-react/button";
import { DocumentSandboxApi } from "../../../../models/DocumentSandboxApi";
import { WatermarkSettings } from "../../../../types";
import { injectWatermark } from "../ui";

interface WatermarkToolProps {
    sandboxProxy: DocumentSandboxApi;
}

export const WatermarkTool: React.FC<WatermarkToolProps> = ({ sandboxProxy }) => {
    const [isApplying, setIsApplying] = React.useState(false);
    const [watermarkBlob, setWatermarkBlob] = React.useState<Blob | null>(null);
    const [opacity, setOpacity] = React.useState(0.5);
    const [scale, setScale] = React.useState(0.3);
    const [position, setPosition] = React.useState<WatermarkSettings["position"]>("bottom-right");

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith("image/")) {
            const blob = new Blob([file], { type: file.type });
            setWatermarkBlob(blob);
            console.log("[UI] Watermark file selected:", file.name);
        } else {
            console.warn("[UI] Please select a valid image file");
        }
    };

    const handleApply = async () => {
        if (!watermarkBlob) {
            alert("Please select a watermark image first");
            return;
        }

        setIsApplying(true);
        try {
            const settings: WatermarkSettings = {
                blob: watermarkBlob,
                opacity: opacity,
                scale: scale,
                position: position
            };

            await injectWatermark(sandboxProxy, settings, {
                onSuccess: () => {
                    console.log("[UI] Watermark applied successfully");
                    setIsApplying(false);
                },
                onError: (error) => {
                    console.error("[UI] Failed to apply watermark:", error);
                    alert("Failed to apply watermark. Check console for details.");
                    setIsApplying(false);
                }
            });
        } catch (error) {
            console.error("[UI] Error applying watermark:", error);
            setIsApplying(false);
        }
    };

    const sliderStyle: React.CSSProperties = {
        width: "100%",
        height: "6px",
        borderRadius: "3px",
        background: "var(--spectrum-global-color-gray-300)",
        outline: "none",
        opacity: 1,
        WebkitAppearance: "none" as any,
        appearance: "none",
        cursor: "pointer",
    };

    const sliderThumbStyle = `
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: var(--spectrum-global-color-blue-500);
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        input[type="range"]::-moz-range-thumb {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: var(--spectrum-global-color-blue-500);
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
    `;

    return (
        <>
            <style>{sliderThumbStyle}</style>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    border: "1px solid var(--spectrum-global-color-gray-300)",
                    borderRadius: "8px",
                    padding: "16px",
                    backgroundColor: "var(--spectrum-global-color-gray-50)",
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "bold", color: "var(--spectrum-global-color-gray-900)" }}>
                        Watermark Tool
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--spectrum-global-color-gray-600)" }}>
                        Inject watermark on all pages
                    </span>
                </div>

                {/* File Upload */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--spectrum-global-color-gray-800)" }}>
                        Watermark Image
                    </span>
                    <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileSelect}
                        style={{ fontSize: "11px" }}
                    />
                    {watermarkBlob && (
                        <span style={{ fontSize: "11px", color: "var(--spectrum-global-color-green-700)" }}>
                            ✓ Watermark image loaded
                        </span>
                    )}
                </div>

                {/* Opacity */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--spectrum-global-color-gray-800)" }}>
                            Opacity
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--spectrum-global-color-gray-600)", minWidth: "40px", textAlign: "right" }}>
                            {(opacity * 100).toFixed(0)}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={opacity}
                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                        style={sliderStyle}
                    />
                </div>

                {/* Scale */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--spectrum-global-color-gray-800)" }}>
                            Scale
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--spectrum-global-color-gray-600)", minWidth: "40px", textAlign: "right" }}>
                            {(scale * 100).toFixed(0)}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.01"
                        value={scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        style={sliderStyle}
                    />
                </div>

                {/* Position */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--spectrum-global-color-gray-800)" }}>
                        Position
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {(["top-left", "top-right", "bottom-left", "bottom-right", "center"] as const).map((pos) => (
                            <Button
                                key={pos}
                                variant={position === pos ? "cta" : "secondary"}
                                onClick={() => setPosition(pos)}
                                style={{
                                    fontSize: "11px",
                                    height: "28px",
                                    textTransform: "capitalize" as any,
                                }}
                            >
                                {pos.replace("-", " ")}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Apply Button */}
                <Button
                    variant="cta"
                    onClick={handleApply}
                    disabled={isApplying || !watermarkBlob}
                    style={{
                        width: "100%",
                        height: "32px",
                        borderRadius: "4px",
                        fontSize: "13px",
                        marginTop: "8px"
                    }}
                >
                    {isApplying ? "Applying Watermark..." : "Apply Watermark to All Pages"}
                </Button>

                <div style={{ fontSize: "11px", color: "var(--spectrum-global-color-gray-600)" }}>
                    {!watermarkBlob ? "Select a watermark image to begin" : "Ready to apply watermark to all pages"}
                </div>
            </div>
        </>
    );
};
