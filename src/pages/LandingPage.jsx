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
                <h1 style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: 80,
                    color: "#2a1f14",
                    margin: 0,
                    fontWeight: 400
                }}>
                    Coming Soon
                </h1>
            </main>
        </div>
    );
}
