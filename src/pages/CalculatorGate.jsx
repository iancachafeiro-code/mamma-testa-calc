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
                // Determine if we need to store session: for now, minimal implementation just redirects.
                // In a real app we might set a cookie or token.
                // For this simple gate, we can pass state via navigation or set a flag in localStorage.
                localStorage.setItem("mt_invite_session", "valid");
                navigate("/calculator/app");
            } else {
                setError("That code isn't quite right. Try again?");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
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
                width: "100%", maxWidth: 400,
                background: "rgba(255,252,248,0.8)",
                padding: 40, borderRadius: 24,
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(212, 196, 176, 0.5)",
                textAlign: "center"
            }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>🔐</div>
                <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: "#2a1f14", margin: "0 0 12px" }}>
                    Beta Access
                </h1>
                <p style={{ color: "#9a8a7a", marginBottom: 32, fontSize: 15, lineHeight: 1.5 }}>
                    The Mamma Testa Calculator is currently invite-only. Please enter your access code below.
                </p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Enter invite code"
                        style={{
                            width: "100%",
                            padding: "16px",
                            fontSize: 16,
                            border: "1px solid #d4c4b0",
                            borderRadius: 12,
                            background: "#fff",
                            marginBottom: 16,
                            outline: "none",
                            textAlign: "center",
                            fontFamily: "monospace",
                            letterSpacing: "0.1em"
                        }}
                    />

                    {error && (
                        <div style={{ color: "#d32f2f", fontSize: 13, marginBottom: 16, background: "rgba(211, 47, 47, 0.08)", padding: "8px 12px", borderRadius: 8 }}>
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
                        {loading ? "Verifying..." : "Unlock Calculator"}
                    </button>
                </form>
            </div>
        </div>
    );
}
