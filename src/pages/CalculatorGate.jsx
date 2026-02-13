import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CalculatorGate() {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/verify-invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });

            if (res.ok) {
                localStorage.setItem("mt_invite_session", "valid");
                navigate("/calculator/app");
            } else {
                setError("Invalid code");
            }
        } catch (err) {
            setError("Error verifying code");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "#f5ede3",
            fontFamily: "'DM Sans', sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
        }}>
            <div style={{
                width: "100%", maxWidth: 360,
                textAlign: "center"
            }}>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Invite Code"
                        style={{
                            width: "100%",
                            padding: "16px",
                            fontSize: 16,
                            border: "1px solid #d4c4b0",
                            borderRadius: 12,
                            background: "rgba(255, 255, 255, 0.8)",
                            outline: "none",
                            textAlign: "center",
                            fontFamily: "monospace",
                            letterSpacing: "0.1em",
                            color: "#2a1f14"
                        }}
                    />

                    {error && (
                        <div style={{ color: "#d32f2f", fontSize: 13, textAlign: "center" }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !code}
                        style={{
                            width: "100%",
                            padding: "16px",
                            background: loading ? "#d4c4b0" : "#c4582a",
                            color: "#fff",
                            border: "none",
                            borderRadius: 12,
                            fontSize: 16,
                            fontWeight: 600,
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "background 0.2s"
                        }}
                    >
                        {loading ? "..." : "Unlock Calculator"}
                    </button>
                </form>
            </div>
        </div>
    );
}
