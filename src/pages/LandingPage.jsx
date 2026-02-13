import { Link } from "react-router-dom";

export default function LandingPage() {
    return (
        <div style={{
            minHeight: "100vh",
            background: "#f5ede3",
            fontFamily: "'DM Sans', sans-serif",
            display: "flex",
            flexDirection: "column"
        }}>
            {/* Nav */}
            <nav style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 14, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9a8a7a" }}>Mamma Testa</div>
                <Link to="/calculator" style={{
                    textDecoration: "none",
                    color: "#2a1f14",
                    fontSize: 14,
                    fontWeight: 500,
                    borderBottom: "1px solid transparent",
                    transition: "border-color 0.2s"
                }}
                    onMouseOver={(e) => e.target.style.borderBottom = "1px solid #c4582a"}
                    onMouseOut={(e) => e.target.style.borderBottom = "1px solid transparent"}
                >
                    Calculator
                </Link>
            </nav>

            {/* Hero */}
            <main style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: 20 }}>
                <div style={{
                    width: 120, height: 120, background: "#e5d8c8", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 32, fontSize: 40
                }}>
                    {/* Placeholder Logo */}
                    🍕
                </div>
                <h1 style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: 64,
                    color: "#2a1f14",
                    margin: "0 0 16px",
                    fontWeight: 400
                }}>
                    Coming Soon
                </h1>
                <p style={{
                    color: "#9a8a7a",
                    fontSize: 18,
                    maxWidth: 400,
                    marginBottom: 40,
                    lineHeight: 1.6
                }}>
                    We're currently baking something special. Check back later for the full Mamma Testa experience.
                </p>

                <Link to="/calculator" style={{
                    padding: "16px 32px",
                    background: "#c4582a",
                    color: "#fff",
                    textDecoration: "none",
                    borderRadius: 30,
                    fontSize: 16,
                    fontWeight: 500,
                    transition: "transform 0.2s, background 0.2s",
                    display: "inline-block"
                }}
                    onMouseOver={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.background = "#b04820"; }}
                    onMouseOut={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.background = "#c4582a"; }}
                >
                    Go to Calculator &rarr;
                </Link>
            </main>
        </div>
    );
}
