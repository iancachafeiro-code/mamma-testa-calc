import { useState, useMemo, useEffect } from "react";

const YEAST_TYPES = [
    { id: "fresh", label: "Fresh Yeast", factor: 1 },
    { id: "active_dry", label: "Active Dry", factor: 0.4 },
    { id: "instant", label: "Instant", factor: 0.33 },
];

const FLOUR_PRESETS = [
    { id: "pastry", label: "Pastry / Cake", protein: 9, wRange: [130, 170], hydrationRange: [50, 58], maxFerment: 8, description: "Delicate, low gluten", strength: "weak" },
    { id: "allpurpose", label: "All-Purpose", protein: 11, wRange: [200, 230], hydrationRange: [55, 63], maxFerment: 16, description: "Versatile, moderate gluten", strength: "medium" },
    { id: "bread_pizza", label: "Bread / Pizza", protein: 12.5, wRange: [280, 320], hydrationRange: [60, 72], maxFerment: 48, description: "Strong, great for Neapolitan", strength: "strong" },
    { id: "manitoba", label: "Manitoba / Strong", protein: 14, wRange: [350, 400], hydrationRange: [65, 80], maxFerment: 72, description: "Very strong, long ferments", strength: "very_strong" },
];

const KNEADING_METHODS = [
    { id: "hand", label: "By Hand", icon: "\u{1F932}" },
    { id: "machine", label: "Stand Mixer", icon: "\u2699\uFE0F" },
];

const PREFERMENT_TYPES = [
    { id: "direct", label: "Direct / Autolyse", icon: "\u{1F4A7}", description: "Simple method \u2014 mix everything together with an autolyse rest" },
    { id: "poolish", label: "Poolish", icon: "\u{1F32B}\uFE0F", description: "Pre-ferment for better flavor, aroma & extensibility" },
];

const POOLISH_FERMENT_OPTIONS = [
    { id: "8h", label: "8 hours", hours: 8, freshYeastPer100g: 0.1, description: "Overnight at room temp" },
    { id: "12h", label: "12 hours", hours: 12, freshYeastPer100g: 0.05, description: "Evening to morning" },
    { id: "16h", label: "16 hours", hours: 16, freshYeastPer100g: 0.02, description: "Long slow ferment, max flavor" },
];

const TEMP_YEAST_FACTOR = (tempC) => {
    if (tempC <= 4) return 0.25;
    if (tempC <= 10) return 0.4;
    if (tempC <= 18) return 0.7;
    if (tempC <= 22) return 1.0;
    if (tempC <= 26) return 1.3;
    if (tempC <= 30) return 1.8;
    return 2.2;
};

const calcFermentSchedule = (totalHours, tempC, preferment) => {
    if (preferment === "poolish") {
        if (totalHours <= 6) {
            return { bulk: totalHours, cold: 0, note: "Room temperature bulk ferment after mixing" };
        } else if (totalHours <= 12) {
            return { bulk: 2, cold: totalHours - 2, note: `${2}h room temp bulk \u2192 ${totalHours - 2}h cold proof in fridge` };
        } else {
            const bulk = Math.min(3, Math.round(totalHours * 0.1));
            return { bulk, cold: totalHours - bulk, note: `${bulk}h room temp bulk \u2192 ${totalHours - bulk}h cold proof in fridge` };
        }
    }
    if (totalHours <= 8) {
        return { bulk: totalHours, cold: 0, note: "Room temperature bulk ferment only" };
    } else if (totalHours <= 16) {
        return { bulk: 2, cold: totalHours - 2, note: `${2}h room temp bulk \u2192 ${totalHours - 2}h cold proof in fridge` };
    } else {
        const bulk = Math.min(4, Math.round(totalHours * 0.1));
        return { bulk, cold: totalHours - bulk, note: `${bulk}h room temp bulk \u2192 ${totalHours - bulk}h cold proof in fridge` };
    }
};

const calcKneadingPlan = (method, tempC, hydration, flourStrength, preferment) => {
    const isCold = tempC < 20;
    const isWarm = tempC > 26;
    const isHighHydration = hydration >= 68;
    const isVeryHighHydration = hydration >= 75;
    const isPoolish = preferment === "poolish";
    const strengthMultiplier = flourStrength === "weak" ? 0.6 : flourStrength === "medium" ? 0.8 : flourStrength === "strong" ? 1.0 : 1.2;
    // Poolish dough already has some gluten development, so kneading is shorter
    const poolishReduction = isPoolish ? 0.7 : 1.0;

    const steps = [];

    if (method === "hand") {
        if (isPoolish) {
            // Poolish method: start by combining poolish with remaining ingredients
            steps.push({
                phase: "Combine Poolish + Flour",
                icon: "\u{1F32B}\uFE0F",
                action: "Pour the ripe poolish into a bowl. Add the remaining flour and most of the remaining water. Mix roughly with your hands until no dry flour remains.",
                duration: 3,
                type: "active",
                tip: "The poolish should be bubbly with a slightly domed surface and smell yeasty-sweet \u2014 that means it's ready",
            });

            const autolyseMin = isCold ? 25 : isWarm ? 12 : 18;
            steps.push({
                phase: "Short Autolyse",
                icon: "\u{1F4A7}",
                action: "Cover and rest. This lets the new flour hydrate and begin developing gluten.",
                duration: autolyseMin,
                type: "rest",
                tip: "Shorter than a direct dough autolyse because the poolish already contributed gluten development",
            });

            steps.push({
                phase: "Add Salt",
                icon: "\u{1F9C2}",
                action: "Dissolve salt in the remaining water. Add to the dough and squeeze/fold until fully incorporated.",
                duration: Math.round(3 * strengthMultiplier * poolishReduction),
                type: "active",
                tip: "No additional yeast needed \u2014 the poolish provides all the leavening",
            });
        } else {
            // Direct autolyse method
            const autolyseMin = isCold ? 40 : isWarm ? 20 : 30;
            steps.push({
                phase: "Autolyse",
                icon: "\u{1F4A7}",
                action: "Mix flour and water only (no salt, no yeast). Cover and rest.",
                duration: autolyseMin,
                type: "rest",
                tip: isCold ? "Use slightly warm water (28\u201330\u00B0C) to compensate for cold dough temp" : isWarm ? "Use cold water (10\u201315\u00B0C) to keep dough from getting too warm" : "Use room temperature water (20\u201322\u00B0C)",
            });

            steps.push({
                phase: "Incorporate Salt & Yeast",
                icon: "\u{1F9C2}",
                action: "Add salt and yeast to the dough. Mix and squeeze until fully incorporated.",
                duration: Math.round(3 * strengthMultiplier),
                type: "active",
                tip: "Dissolve salt in a small splash of reserved water for easier incorporation",
            });
        }

        if (isHighHydration || isVeryHighHydration) {
            const foldSets = isPoolish
                ? (isVeryHighHydration ? 4 : 3) // fewer sets needed with poolish
                : (isVeryHighHydration ? 5 : 4);
            const restBetween = isCold ? 35 : isWarm ? 20 : 30;

            steps.push({
                phase: "Initial Knead",
                icon: "\u{1F90C}",
                action: isPoolish
                    ? "Slap and fold on the counter. Poolish dough is more extensible \u2014 it will come together faster."
                    : "Slap and fold technique on the counter. The dough will be sticky \u2014 don't add flour, use wet hands.",
                duration: Math.round(5 * strengthMultiplier * poolishReduction),
                type: "active",
                tip: "Lift the dough, slap it on the counter, fold over. Repeat rhythmically.",
            });

            for (let i = 1; i <= foldSets; i++) {
                steps.push({
                    phase: `Rest ${i}`,
                    icon: "\u{1F634}",
                    action: "Cover the dough and let the gluten relax.",
                    duration: restBetween,
                    type: "rest",
                    tip: i === 1 ? (isPoolish ? "Poolish dough develops strength faster \u2014 you'll notice improvement quickly" : "The dough will feel much smoother after this rest") : undefined,
                });
                steps.push({
                    phase: `Stretch & Fold ${i}`,
                    icon: "\u{1F504}",
                    action: `Set ${i} of ${foldSets}: Wet your hands, grab one side of the dough, stretch up and fold over the center. Rotate 90\u00B0 and repeat 4 times.`,
                    duration: 2,
                    type: "active",
                    tip: i === foldSets ? "The dough should feel noticeably tighter and hold its shape" : undefined,
                });
            }
        } else {
            const kneadTime1 = Math.round((isCold ? 10 : isWarm ? 6 : 8) * strengthMultiplier * poolishReduction);
            steps.push({
                phase: "First Knead",
                icon: "\u{1F90C}",
                action: isPoolish
                    ? "Push the dough away with the heel of your palm, fold it back, rotate 90\u00B0. Poolish dough is more extensible so it develops faster."
                    : "Push the dough away with the heel of your palm, fold it back, rotate 90\u00B0. Repeat with rhythm.",
                duration: kneadTime1,
                type: "active",
                tip: isCold ? "Cold dough is stiffer \u2014 use more force and be patient, it will loosen up" : isWarm ? "Dough will be softer and stickier \u2014 work quickly to avoid overheating" : "Find a comfortable rhythm \u2014 consistent pressure is more important than speed",
            });

            const restTime1 = isCold ? 15 : isWarm ? 8 : 10;
            steps.push({
                phase: "Bench Rest",
                icon: "\u{1F634}",
                action: "Cover the dough and let the gluten relax. This makes the second knead much easier.",
                duration: restTime1,
                type: "rest",
                tip: "The dough will become noticeably easier to work with after resting",
            });

            const kneadTime2 = Math.round((isCold ? 8 : isWarm ? 4 : 6) * strengthMultiplier * poolishReduction);
            steps.push({
                phase: "Second Knead",
                icon: "\u{1F90C}",
                action: "Knead until the dough is smooth, elastic, and passes the windowpane test.",
                duration: kneadTime2,
                type: "active",
                tip: isPoolish
                    ? "Poolish dough reaches windowpane faster \u2014 don't over-knead or you'll lose the open crumb structure"
                    : "Windowpane test: stretch a small piece thin \u2014 if you can see light through it without tearing, the gluten is developed",
            });
        }

        const finalRestMin = isCold ? 20 : isWarm ? 10 : 15;
        steps.push({
            phase: "Final Rest",
            icon: "\u{1F634}",
            action: "Shape into a rough ball, cover, and let the dough relax before dividing.",
            duration: finalRestMin,
            type: "rest",
            tip: "This rest makes the dough easier to divide and shape into balls",
        });

        steps.push({
            phase: "Divide & Ball",
            icon: "\u26AA",
            action: "Divide the dough into portions using a scraper. Shape each piece into a tight ball by tucking the edges underneath and rotating on the counter.",
            duration: 4,
            type: "active",
            tip: isPoolish
                ? "Poolish dough is more extensible \u2014 be gentle when shaping to preserve the gas bubbles"
                : "Use a scale for consistency. Seal the bottom of each ball well \u2014 a tight surface creates better oven spring.",
        });

    } else {
        // MACHINE METHOD
        if (isPoolish) {
            steps.push({
                phase: "Combine Poolish + Flour",
                icon: "\u{1F32B}\uFE0F",
                action: "Add the ripe poolish to the mixer bowl. Add remaining flour and most of the remaining water. Mix on speed 1 for 2 minutes until roughly combined.",
                duration: 2,
                type: "active",
                tip: "The poolish should be bubbly with a slightly domed surface \u2014 that means it's ready to use",
            });

            const autolyseMin = isCold ? 20 : isWarm ? 10 : 15;
            steps.push({
                phase: "Short Autolyse",
                icon: "\u{1F4A7}",
                action: "Cover the bowl and let the new flour hydrate.",
                duration: autolyseMin,
                type: "rest",
                tip: "Shorter rest than direct method since poolish already developed gluten",
            });

            steps.push({
                phase: "Add Salt",
                icon: "\u{1F9C2}",
                action: "Dissolve salt in remaining water. Add to bowl and mix on speed 1 until incorporated.",
                duration: 2,
                type: "active",
                tip: "No additional yeast needed \u2014 the poolish provides all the leavening",
            });
        } else {
            const autolyseMin = isCold ? 35 : isWarm ? 15 : 25;
            steps.push({
                phase: "Autolyse",
                icon: "\u{1F4A7}",
                action: "Combine flour and water in the mixer bowl with the dough hook. Mix on lowest speed for 1 min, then cover and rest.",
                duration: autolyseMin,
                type: "rest",
                tip: isCold ? "Use slightly warm water (28\u201330\u00B0C) to compensate for cold environment" : isWarm ? "Use cold water (10\u201315\u00B0C) \u2014 the mixer friction will add heat" : "Room temp water works well",
            });

            steps.push({
                phase: "Incorporate Salt & Yeast",
                icon: "\u{1F9C2}",
                action: "Add salt and yeast. Mix on speed 1 (lowest) until fully incorporated.",
                duration: 2,
                type: "active",
                tip: "Keep on low speed \u2014 high speed at this stage tears the developing gluten",
            });
        }

        const lowSpeedMin = Math.round((isCold ? 6 : isWarm ? 3 : 4) * strengthMultiplier * poolishReduction);
        steps.push({
            phase: "Low Speed Mix",
            icon: "\u2699\uFE0F",
            action: "Mix on speed 1\u20132 (low). The dough will start pulling away from the sides.",
            duration: lowSpeedMin,
            type: "active",
            tip: isWarm ? "Watch the dough temp \u2014 stop and rest if it feels warm to the touch" : "Scrape down the sides once or twice if needed",
        });

        const machineRest = isCold ? 10 : isWarm ? 8 : 8;
        steps.push({
            phase: "Rest",
            icon: "\u{1F634}",
            action: "Stop the mixer, cover the bowl, and let the gluten relax.",
            duration: machineRest,
            type: "rest",
            tip: "This rest prevents the dough from overheating and allows gluten to organize",
        });

        const medSpeedMin = Math.round((isCold ? 5 : isWarm ? 3 : 4) * strengthMultiplier * poolishReduction);
        steps.push({
            phase: "Medium Speed Knead",
            icon: "\u2699\uFE0F",
            action: isPoolish
                ? "Mix on speed 2\u20133 (medium) until smooth and elastic. Poolish dough develops faster \u2014 check early."
                : "Mix on speed 2\u20133 (medium) until the dough is smooth and elastic. It should cleanly pull away from the bowl.",
            duration: medSpeedMin,
            type: "active",
            tip: isPoolish
                ? "Be careful not to over-mix \u2014 poolish dough can go from perfect to overworked quickly"
                : "Do the windowpane test: stretch a small piece thin \u2014 if light passes through without tearing, you're done",
        });

        if (isHighHydration) {
            steps.push({
                phase: "Rest",
                icon: "\u{1F634}",
                action: "The high hydration needs extra gluten development. Rest before a final short mix.",
                duration: 10,
                type: "rest",
            });
            steps.push({
                phase: "Final Mix",
                icon: "\u2699\uFE0F",
                action: "Quick mix on speed 2 to tighten the gluten structure.",
                duration: 2,
                type: "active",
                tip: "Don't overdo it \u2014 just 2 minutes max at this stage",
            });
        }

        const finalRestMin = isCold ? 15 : isWarm ? 8 : 10;
        steps.push({
            phase: "Final Rest",
            icon: "\u{1F634}",
            action: "Remove from bowl, shape into a rough ball, cover, and let relax.",
            duration: finalRestMin,
            type: "rest",
            tip: "Let the dough come to a workable state before dividing",
        });

        steps.push({
            phase: "Divide & Ball",
            icon: "\u26AA",
            action: "Divide the dough into portions using a scraper. Shape each piece into a tight ball by tucking the edges underneath and rotating on the counter.",
            duration: 4,
            type: "active",
            tip: isPoolish
                ? "Poolish dough is more extensible \u2014 be gentle to preserve gas bubbles"
                : "Use a scale for consistency. Seal the bottom well.",
        });
    }

    const totalActive = steps.filter(s => s.type === "active").reduce((a, s) => a + s.duration, 0);
    const totalRest = steps.filter(s => s.type === "rest").reduce((a, s) => a + s.duration, 0);
    const totalTime = totalActive + totalRest;

    return { steps, totalActive, totalRest, totalTime };
};

// ─── UI Components ───────────────────────────────────────────────

const Slider = ({ label, value, onChange, min, max, step = 1, unit = "", subtext }) => (
    <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: "#5a4a3a", letterSpacing: "0.03em", textTransform: "uppercase" }}>{label}</label>
            <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, color: "#2a1f14", fontWeight: 400 }}>{value}{unit}</span>
        </div>
        {subtext && <div style={{ fontSize: 12, color: "#9a8a7a", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>{subtext}</div>}
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%", accentColor: "#c4582a" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#b0a090", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
            <span>{min}{unit}</span><span>{max}{unit}</span>
        </div>
    </div>
);

const NumberInput = ({ label, value, onChange, min, max, step = 1, unit = "" }) => (
    <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: "#5a4a3a", letterSpacing: "0.03em", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => onChange(Math.max(min, value - step))} style={{ width: 36, height: 36, border: "1.5px solid #d4c4b0", borderRadius: "50%", background: "transparent", cursor: "pointer", fontSize: 18, color: "#5a4a3a", display: "flex", alignItems: "center", justifyContent: "center" }}>{"\u2212"}</button>
            <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, color: "#2a1f14", minWidth: 60, textAlign: "center" }}>{value}{unit && <span style={{ fontSize: 14, color: "#9a8a7a", marginLeft: 4 }}>{unit}</span>}</span>
            <button onClick={() => onChange(Math.min(max, value + step))} style={{ width: 36, height: 36, border: "1.5px solid #d4c4b0", borderRadius: "50%", background: "transparent", cursor: "pointer", fontSize: 18, color: "#5a4a3a", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        </div>
    </div>
);

const OptionPill = ({ selected, onClick, children, description }) => (
    <button onClick={onClick} style={{
        padding: description ? "10px 14px" : "8px 16px",
        border: selected ? "2px solid #c4582a" : "1.5px solid #d4c4b0",
        borderRadius: 12,
        background: selected ? "rgba(196, 88, 42, 0.08)" : "transparent",
        cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
        fontWeight: selected ? 600 : 400, color: selected ? "#c4582a" : "#5a4a3a",
        transition: "all 0.2s ease", textAlign: "left", lineHeight: 1.3,
    }}>
        {children}
        {description && <div style={{ fontSize: 11, color: selected ? "#c4582a" : "#9a8a7a", marginTop: 2, fontWeight: 400 }}>{description}</div>}
    </button>
);

const Card = ({ title, icon, children, accent = false, warm = false }) => (
    <div style={{
        background: accent ? "linear-gradient(135deg, #2a1f14 0%, #3d2e1e 100%)" : warm ? "linear-gradient(135deg, #3d2410 0%, #4a2d14 100%)" : "rgba(255,252,248,0.8)",
        borderRadius: 20, padding: "28px 24px",
        border: (accent || warm) ? "none" : "1px solid rgba(212, 196, 176, 0.5)",
        backdropFilter: "blur(10px)",
    }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, fontWeight: 400, color: (accent || warm) ? "#f0e6d8" : "#2a1f14", margin: 0 }}>{title}</h2>
        </div>
        {children}
    </div>
);

const RecipeRow = ({ label, value, unit, highlight = false, dim = false }) => (
    <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        padding: "10px 0", borderBottom: "1px solid rgba(240, 230, 216, 0.3)",
        opacity: dim ? 0.5 : 1,
    }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: highlight ? "#f0c090" : "#c4b8a8", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: highlight ? 32 : 24, color: highlight ? "#fff" : "#f0e6d8" }}>
            {value}<span style={{ fontSize: 13, color: "#a09080", marginLeft: 4, fontFamily: "'DM Sans', sans-serif" }}>{unit}</span>
        </span>
    </div>
);

const TimelineStep = ({ step, isLast }) => {
    const isActive = step.type === "active";
    return (
        <div style={{ display: "flex", gap: 14, position: "relative" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 32 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: isActive ? "#c4582a" : "rgba(196, 88, 42, 0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0,
                }}>{step.icon}</div>
                {!isLast && <div style={{ width: 2, flex: 1, background: "linear-gradient(to bottom, #d4c4b0, rgba(212, 196, 176, 0.3))", minHeight: 20 }} />}
            </div>
            <div style={{ paddingBottom: isLast ? 0 : 20, flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 16, color: "#2a1f14" }}>{step.phase}</span>
                    <span style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
                        color: isActive ? "#c4582a" : "#9a8a7a",
                        background: isActive ? "rgba(196, 88, 42, 0.08)" : "rgba(154, 138, 122, 0.1)",
                        padding: "3px 10px", borderRadius: 20,
                    }}>{step.duration} min</span>
                </div>
                <div style={{ fontSize: 13, color: "#5a4a3a", lineHeight: 1.55, marginBottom: step.tip ? 8 : 0 }}>{step.action}</div>
                {step.tip && (
                    <div style={{ fontSize: 12, color: "#9a8a7a", fontStyle: "italic", lineHeight: 1.5, paddingLeft: 12, borderLeft: "2px solid rgba(196, 88, 42, 0.2)" }}>
                        {"\u{1F4A1}"} {step.tip}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────

export default function App() {
    const [balls, setBalls] = useState(4);
    const [ballWeight, setBallWeight] = useState(250);
    const [flourPreset, setFlourPreset] = useState("bread_pizza");
    const [hydration, setHydration] = useState(65);
    const [saltPct, setSaltPct] = useState(2.8);
    const [yeastType, setYeastType] = useState("fresh");
    const [fermentHours, setFermentHours] = useState(24);
    const [tempC, setTempC] = useState(22);
    const [kneadMethod, setKneadMethod] = useState("hand");
    const [preferment, setPreferment] = useState("direct");
    const [poolishTime, setPoolishTime] = useState("12h");
    const [poolishPct, setPoolishPct] = useState(40);

    const flour = FLOUR_PRESETS.find((f) => f.id === flourPreset);

    useEffect(() => {
        if (hydration < flour.hydrationRange[0]) setHydration(flour.hydrationRange[0]);
        if (hydration > flour.hydrationRange[1]) setHydration(flour.hydrationRange[1]);
    }, [flourPreset]);

    const recipe = useMemo(() => {
        const totalDough = balls * ballWeight;
        const flourG = totalDough / (1 + hydration / 100 + saltPct / 100 + 0.01);
        const waterG = flourG * (hydration / 100);
        const saltG = flourG * (saltPct / 100);

        const baseFreshYeast = flourG * 0.003;
        const tempFactor = TEMP_YEAST_FACTOR(tempC);
        const timeFactor = fermentHours <= 4 ? 2.5 : fermentHours <= 8 ? 1.5 : fermentHours <= 16 ? 1 : fermentHours <= 24 ? 0.6 : fermentHours <= 48 ? 0.3 : 0.15;

        const freshYeast = baseFreshYeast * tempFactor * timeFactor;
        const yeast = YEAST_TYPES.find((y) => y.id === yeastType);
        const yeastG = freshYeast * yeast.factor;

        const schedule = calcFermentSchedule(fermentHours, tempC, preferment);

        // Poolish calculations
        let poolish = null;
        if (preferment === "poolish") {
            const poolishFlour = flourG * (poolishPct / 100);
            const poolishWater = poolishFlour; // 100% hydration poolish
            const poolishOption = POOLISH_FERMENT_OPTIONS.find(o => o.id === poolishTime);
            const poolishFreshYeast = poolishFlour * (poolishOption.freshYeastPer100g / 100);
            const poolishYeastG = poolishFreshYeast * yeast.factor;

            const remainingFlour = flourG - poolishFlour;
            const remainingWater = waterG - poolishWater;

            poolish = {
                flour: Math.round(poolishFlour),
                water: Math.round(poolishWater),
                yeast: parseFloat(Math.max(0.05, poolishYeastG).toFixed(2)),
                totalWeight: Math.round(poolishFlour + poolishWater + poolishYeastG),
                remainingFlour: Math.round(remainingFlour),
                remainingWater: Math.round(Math.max(0, remainingWater)),
                fermentHours: poolishOption.hours,
                fermentLabel: poolishOption.label,
            };
        }

        return {
            totalDough: Math.round(totalDough),
            flour: Math.round(flourG),
            water: Math.round(waterG),
            salt: parseFloat(saltG.toFixed(1)),
            yeast: parseFloat(Math.max(0.1, yeastG).toFixed(1)),
            schedule,
            poolish,
        };
    }, [balls, ballWeight, hydration, saltPct, yeastType, fermentHours, tempC, flourPreset, preferment, poolishTime, poolishPct]);

    const kneadingPlan = useMemo(() => {
        return calcKneadingPlan(kneadMethod, tempC, hydration, flour.strength, preferment);
    }, [kneadMethod, tempC, hydration, flour.strength, preferment]);

    const poolishOption = POOLISH_FERMENT_OPTIONS.find(o => o.id === poolishTime);

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(180deg, #f5ede3 0%, #ebe0d2 50%, #e5d8c8 100%)",
            fontFamily: "'DM Sans', sans-serif",
        }}>
            <div style={{ maxWidth: 480, margin: "0 auto", padding: "40px 20px 80px" }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 40, animation: "fadeInUp 0.6s ease" }}>
                    <div style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9a8a7a", marginBottom: 8 }}>Mamma Testa</div>
                    <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 42, fontWeight: 400, color: "#2a1f14", margin: "0 0 8px", lineHeight: 1.1 }}>
                        Pizza Dough<br /><em>Calculator</em>
                    </h1>
                    <div style={{ width: 40, height: 2, background: "#c4582a", margin: "16px auto 0", borderRadius: 1 }}></div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Dough Size */}
                    <div style={{ animation: "fadeInUp 0.6s ease 0.1s both" }}>
                        <Card title="Dough Size" icon={"\u{1F90C}"}>
                            <div style={{ display: "flex", gap: 24 }}>
                                <NumberInput label="Dough Balls" value={balls} onChange={setBalls} min={1} max={20} step={1} />
                                <NumberInput label="Weight Each" value={ballWeight} onChange={setBallWeight} min={150} max={400} step={10} unit="g" />
                            </div>
                            <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(196, 88, 42, 0.06)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                <span style={{ fontSize: 12, color: "#9a8a7a", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total dough</span>
                                <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, color: "#c4582a" }}>{recipe.totalDough}g</span>
                            </div>
                        </Card>
                    </div>

                    {/* Flour Type */}
                    <div style={{ animation: "fadeInUp 0.6s ease 0.13s both" }}>
                        <Card title="Flour Type" icon={"\u{1F33E}"}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                                {FLOUR_PRESETS.map((f) => (
                                    <OptionPill key={f.id} selected={flourPreset === f.id} onClick={() => setFlourPreset(f.id)} description={`~${f.protein}% protein \u00B7 W${f.wRange[0]}\u2013${f.wRange[1]}`}>
                                        {f.label}
                                    </OptionPill>
                                ))}
                            </div>
                            <div style={{ fontSize: 12, color: "#9a8a7a", marginTop: 12, fontStyle: "italic", lineHeight: 1.5 }}>
                                {flour.description} {"\u00B7"} Hydration: {flour.hydrationRange[0]}\u2013{flour.hydrationRange[1]}% {"\u00B7"} Max ferment: {flour.maxFerment}h
                            </div>
                        </Card>
                    </div>

                    {/* Pre-ferment Method */}
                    <div style={{ animation: "fadeInUp 0.6s ease 0.16s both" }}>
                        <Card title="Method" icon={"\u{1F9EA}"}>
                            <div style={{ display: "flex", gap: 8, marginBottom: preferment === "poolish" ? 16 : 0 }}>
                                {PREFERMENT_TYPES.map((p) => (
                                    <button key={p.id} onClick={() => setPreferment(p.id)} style={{
                                        flex: 1, padding: "14px 12px",
                                        border: preferment === p.id ? "2px solid #c4582a" : "1.5px solid #d4c4b0",
                                        borderRadius: 14,
                                        background: preferment === p.id ? "rgba(196, 88, 42, 0.08)" : "transparent",
                                        cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                                        fontWeight: preferment === p.id ? 600 : 400,
                                        color: preferment === p.id ? "#c4582a" : "#5a4a3a",
                                        transition: "all 0.2s ease", textAlign: "center",
                                    }}>
                                        <div style={{ fontSize: 22, marginBottom: 4 }}>{p.icon}</div>
                                        {p.label}
                                        <div style={{ fontSize: 10, color: preferment === p.id ? "#c4582a" : "#9a8a7a", marginTop: 4, fontWeight: 400, lineHeight: 1.3 }}>{p.description}</div>
                                    </button>
                                ))}
                            </div>

                            {preferment === "poolish" && (
                                <>
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: "#5a4a3a", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 8 }}>Poolish Ferment Time</div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            {POOLISH_FERMENT_OPTIONS.map((opt) => (
                                                <OptionPill key={opt.id} selected={poolishTime === opt.id} onClick={() => setPoolishTime(opt.id)} description={opt.description}>
                                                    {opt.label}
                                                </OptionPill>
                                            ))}
                                        </div>
                                    </div>
                                    <Slider label="Flour in Poolish" value={poolishPct} onChange={setPoolishPct} min={20} max={60} step={5} unit="%" subtext="How much of the total flour goes into the poolish (30 - 50% is typical)" />
                                </>
                            )}
                        </Card>
                    </div>

                    {/* Hydration & Salt */}
                    <div style={{ animation: "fadeInUp 0.6s ease 0.19s both" }}>
                        <Card title="Hydration & Salt" icon={"\u{1F4A7}"}>
                            <Slider label="Hydration" value={hydration} onChange={setHydration} min={flour.hydrationRange[0]} max={flour.hydrationRange[1]} step={0.5} unit="%" subtext={`Recommended for ${flour.label}: ${flour.hydrationRange[0]}\u2013${flour.hydrationRange[1]}%`} />
                            <Slider label="Salt" value={saltPct} onChange={setSaltPct} min={1.5} max={4} step={0.1} unit="%" subtext="Neapolitan standard: 2.5\u20133%" />
                        </Card>
                    </div>

                    {/* Yeast */}
                    <div style={{ animation: "fadeInUp 0.6s ease 0.22s both" }}>
                        <Card title="Yeast Type" icon={"\u{1FAE7}"}>
                            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                                {YEAST_TYPES.map((y) => (
                                    <OptionPill key={y.id} selected={yeastType === y.id} onClick={() => setYeastType(y.id)}>{y.label}</OptionPill>
                                ))}
                            </div>
                            <div style={{ fontSize: 12, color: "#9a8a7a", marginTop: 10, fontStyle: "italic" }}>
                                {yeastType === "fresh" ? "Standard reference \u2014 soft, perishable blocks" : yeastType === "active_dry" ? "40% of fresh yeast amount \u2014 needs warm water activation" : "33% of fresh yeast amount \u2014 mix directly into flour"}
                            </div>
                        </Card>
                    </div>

                    {/* Fermentation */}
                    <div style={{ animation: "fadeInUp 0.6s ease 0.25s both" }}>
                        <Card title={preferment === "poolish" ? "Final Dough Fermentation" : "Fermentation"} icon={"\u23F1"}>
                            {preferment === "poolish" && (
                                <div style={{ fontSize: 12, color: "#9a8a7a", fontStyle: "italic", marginBottom: 16, lineHeight: 1.5, padding: "10px 14px", background: "rgba(154, 138, 122, 0.06)", borderRadius: 10 }}>
                                    This is the fermentation time after you mix the poolish into the final dough. The poolish itself ferments separately for {poolishOption.label} before this step.
                                </div>
                            )}
                            <Slider label="Ferment Time" value={fermentHours} onChange={(v) => setFermentHours(Math.min(v, flour.maxFerment))} min={2} max={flour.maxFerment} step={1} unit="h" subtext={`Max for ${flour.label}: ${flour.maxFerment} hours`} />
                            <Slider label="Room Temperature" value={tempC} onChange={setTempC} min={4} max={35} step={1} unit={"\u00B0C"} subtext="Higher temp = faster fermentation = less yeast needed" />
                            <div style={{ marginTop: 8, padding: "14px 16px", background: "rgba(196, 88, 42, 0.06)", borderRadius: 12, fontSize: 13, color: "#5a4a3a", lineHeight: 1.6 }}>
                                {"\u{1F4CB}"} <strong>Schedule:</strong> {recipe.schedule.note}
                            </div>
                        </Card>
                    </div>

                    {/* Poolish Recipe Card */}
                    {preferment === "poolish" && recipe.poolish && (
                        <div style={{ animation: "fadeInUp 0.6s ease 0.28s both" }}>
                            <Card title="Poolish Recipe" icon={"\u{1F32B}\uFE0F"} warm>
                                <div style={{ fontSize: 12, color: "#c4a880", marginBottom: 16, fontStyle: "italic", lineHeight: 1.5 }}>
                                    Make this {recipe.poolish.fermentLabel} before your final dough. The poolish is ready when it's bubbly, slightly domed, and smells sweet and yeasty.
                                </div>
                                <RecipeRow label="Flour" value={recipe.poolish.flour} unit="g" highlight />
                                <RecipeRow label="Water" value={recipe.poolish.water} unit="g" />
                                <RecipeRow label={YEAST_TYPES.find(y => y.id === yeastType).label + " Yeast"} value={recipe.poolish.yeast} unit="g" />
                                <div style={{ borderTop: "1px solid rgba(240, 230, 216, 0.2)", marginTop: 12, paddingTop: 12 }}>
                                    <RecipeRow label="Poolish Total" value={recipe.poolish.totalWeight} unit="g" highlight />
                                </div>
                                <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(196, 136, 80, 0.1)", borderRadius: 12, fontSize: 13, color: "#f0d8b8", lineHeight: 1.6 }}>
                                    {"\u{1F551}"} <strong>Timeline:</strong> Mix the poolish {recipe.poolish.fermentHours}h before you plan to make the final dough. Keep covered at room temperature ({tempC}{"\u00B0"}C).
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Recipe Output */}
                    <div style={{ animation: "fadeInUp 0.6s ease 0.31s both" }}>
                        <Card title={preferment === "poolish" ? "Final Dough Recipe" : "Your Recipe"} icon={"\u{1F4D0}"} accent>
                            <div style={{ fontSize: 12, color: "#a09080", marginBottom: 16, fontStyle: "italic" }}>
                                {balls} {"\u00D7"} {ballWeight}g balls {"\u00B7"} {flour.label} {"\u00B7"} {hydration}% hydration {"\u00B7"} {YEAST_TYPES.find(y => y.id === yeastType).label} {"\u00B7"} {fermentHours}h at {tempC}{"\u00B0"}C
                                {preferment === "poolish" && ` \u00B7 ${poolishPct}% poolish`}
                            </div>

                            {preferment === "poolish" && recipe.poolish ? (
                                <>
                                    <div style={{ fontSize: 11, color: "#a09080", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Add to the poolish:</div>
                                    <RecipeRow label="Remaining Flour" value={recipe.poolish.remainingFlour} unit="g" highlight />
                                    <RecipeRow label="Remaining Water" value={recipe.poolish.remainingWater} unit="g" />
                                    <RecipeRow label="Salt" value={recipe.salt} unit="g" />
                                    <div style={{ fontSize: 11, color: "#706050", marginTop: 12, marginBottom: 4, fontStyle: "italic" }}>No additional yeast \u2014 the poolish provides leavening</div>
                                    <div style={{ borderTop: "1px solid rgba(240, 230, 216, 0.2)", marginTop: 12, paddingTop: 12 }}>
                                        <div style={{ fontSize: 11, color: "#a09080", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Grand total (all ingredients)</div>
                                        <RecipeRow label="Total Flour" value={recipe.flour} unit="g" />
                                        <RecipeRow label="Total Water" value={recipe.water} unit="g" />
                                        <RecipeRow label="Total Salt" value={recipe.salt} unit="g" />
                                        <RecipeRow label="Total Dough" value={recipe.totalDough} unit="g" highlight />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <RecipeRow label="Flour" value={recipe.flour} unit="g" highlight />
                                    <RecipeRow label="Water" value={recipe.water} unit="g" />
                                    <RecipeRow label="Salt" value={recipe.salt} unit="g" />
                                    <RecipeRow label={YEAST_TYPES.find(y => y.id === yeastType).label + " Yeast"} value={recipe.yeast} unit="g" />
                                    <div style={{ borderTop: "1px solid rgba(240, 230, 216, 0.2)", marginTop: 12, paddingTop: 12 }}>
                                        <RecipeRow label="Total Dough" value={recipe.totalDough} unit="g" highlight />
                                    </div>
                                </>
                            )}
                        </Card>
                    </div>

                    {/* Kneading Guide */}
                    <div style={{ animation: "fadeInUp 0.6s ease 0.34s both" }}>
                        <Card title="Kneading Guide" icon={"\u{1FAF6}"}>
                            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                                {KNEADING_METHODS.map((m) => (
                                    <button key={m.id} onClick={() => setKneadMethod(m.id)} style={{
                                        flex: 1, padding: "14px 16px",
                                        border: kneadMethod === m.id ? "2px solid #c4582a" : "1.5px solid #d4c4b0",
                                        borderRadius: 14, background: kneadMethod === m.id ? "rgba(196, 88, 42, 0.08)" : "transparent",
                                        cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                                        fontWeight: kneadMethod === m.id ? 600 : 400, color: kneadMethod === m.id ? "#c4582a" : "#5a4a3a",
                                        transition: "all 0.2s ease", textAlign: "center",
                                    }}>
                                        <div style={{ fontSize: 22, marginBottom: 4 }}>{m.icon}</div>
                                        {m.label}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                                {[
                                    { label: "Hands-on", value: kneadingPlan.totalActive, color: "#c4582a", bg: "rgba(196, 88, 42, 0.06)" },
                                    { label: "Resting", value: kneadingPlan.totalRest, color: "#5a4a3a", bg: "rgba(154, 138, 122, 0.08)" },
                                    { label: "Total", value: kneadingPlan.totalTime, color: "#2a1f14", bg: "rgba(42, 31, 20, 0.06)" },
                                ].map((item) => (
                                    <div key={item.label} style={{ flex: 1, padding: "12px", background: item.bg, borderRadius: 12, textAlign: "center" }}>
                                        <div style={{ fontSize: 11, color: "#9a8a7a", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{item.label}</div>
                                        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: item.color }}>{item.value}<span style={{ fontSize: 12, color: "#9a8a7a", fontFamily: "'DM Sans', sans-serif" }}> min</span></div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ fontSize: 12, color: "#9a8a7a", fontStyle: "italic", marginBottom: 20, lineHeight: 1.5, padding: "10px 14px", background: "rgba(154, 138, 122, 0.06)", borderRadius: 10 }}>
                                Adjusted for {tempC}{"\u00B0"}C dough temp {"\u00B7"} {hydration}% hydration {"\u00B7"} {flour.label} flour
                                {preferment === "poolish" && " \u00B7 Poolish method (reduced kneading)"}
                                {hydration >= 68 && kneadMethod === "hand" && " \u00B7 Stretch & fold for high hydration"}
                            </div>

                            <div>
                                {kneadingPlan.steps.map((step, i) => (
                                    <TimelineStep key={i} step={step} isLast={i === kneadingPlan.steps.length - 1} />
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Footer */}
                    <div style={{ textAlign: "center", marginTop: 24, animation: "fadeInUp 0.6s ease 0.37s both" }}>
                        <div style={{ fontSize: 11, color: "#b0a090", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            Made with {"\u{1F525}"} by Mamma Testa
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
