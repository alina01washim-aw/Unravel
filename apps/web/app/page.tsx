"use client";

import { useState } from "react";

type GemmaResult = {
  summary: string;
  why: string[];
  uncertainty: string;
  action: string;
};

type ScenarioResult = {
  summary: string;
  why: string[];
  uncertainty: string;
  action: string;
};

type ScenarioData = {
  scenario_risk_6h: number;
  scenario_risk_12h: number;
  scenario_risk_24h: number;
  scenario_onset_hours: number;
  baseline_risk: number;
  scenario_rainfall_6h_mm: number;
  rainfall_change_mm: number;
  risk_change: number;
};

export default function Home() {
  const [result, setResult] = useState<GemmaResult | null>(null);
  const [scenarioResult, setScenarioResult] =
    useState<ScenarioResult | null>(null);

  const [scenarioData, setScenarioData] = useState<ScenarioData | null>(null);

  const [rainfall, setRainfall] = useState(180);
  const [loading, setLoading] = useState(false);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [error, setError] = useState("");
  const [scenarioError, setScenarioError] = useState("");

  async function explainWithGemma() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/gemma", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context: {
            zone_name: "Ward 17",
            status: "ALERT",
            risk_probability: 0.81,
            rainfall_6h_mm: 146,
            antecedent_rainfall_mm: 82,
            risk_6h: 0.74,
            risk_12h: 0.81,
            risk_24h: 0.78,
            onset_hours: 8,
            confidence: "moderate",
            top_drivers: [
              "High recent rainfall",
              "High antecedent rainfall",
              "Projected 12-hour risk peak",
            ],
          },
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || "Gemma request failed");
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  async function runScenario() {
    setScenarioLoading(true);
    setScenarioError("");
    setScenarioResult(null);

    try {
      const response = await fetch("/api/scenario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          zone_name: "Ward 17",
          baseline_risk: 0.81,
          baseline_rainfall_6h_mm: 146,
          scenario_rainfall_6h_mm: rainfall,
          baseline_risk_6h: 0.74,
          baseline_risk_12h: 0.81,
          baseline_risk_24h: 0.78,
          baseline_onset_hours: 8,
          confidence: "moderate",
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);

        throw new Error(
          body?.detail || "Scenario request failed"
        );
      }

      const data = await response.json();

      setScenarioData(data.scenario);
      setScenarioResult(data.result);
    } catch (err) {
      setScenarioError(
        err instanceof Error
          ? err.message
          : "Scenario analysis failed"
      );
    } finally {
      setScenarioLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-4 py-6 text-neutral-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <header className="mb-8">
          <div className="flex flex-col gap-5 border-b border-stone-200 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-sm font-bold text-white shadow-sm">
                  U
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-600">
                    UNRAVEL AI
                  </p>
                  <p className="text-xs text-stone-500">
                    Flood intelligence operations platform
                  </p>
                </div>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
                Flood Intelligence Control Room
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500 sm:text-base">
                Predict future flood risk, understand why conditions changed,
                simulate possible rainfall scenarios, and prepare before
                impact.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-full border border-stone-200 bg-white px-4 py-2 shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_0_4px_#ffedd5]" />
              <span className="text-sm font-medium text-stone-700">
                Monitoring active
              </span>
            </div>
          </div>
        </header>

        {/* TOP GRID */}
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          {/* FORECAST */}
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                  Forecast zone
                </p>

                <h2 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950">
                  Ward 17
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  Current flood-risk assessment
                </p>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-600" />
                ALERT
              </span>
            </div>

            {/* PRIMARY RISK */}
            <div className="mt-7 rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-stone-500">
                    Current risk
                  </p>

                  <p className="mt-1 text-5xl font-bold tracking-tight text-orange-600">
                    81%
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider text-stone-400">
                    Estimated onset
                  </p>

                  <p className="mt-1 text-2xl font-bold text-neutral-900">
                    ~8h
                  </p>

                  <p className="mt-1 text-xs text-stone-500">
                    Confidence: moderate
                  </p>
                </div>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-orange-100">
                <div className="h-full w-[81%] rounded-full bg-orange-500" />
              </div>
            </div>

            {/* METRICS */}
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Metric label="Current" value="81%" highlight />
              <Metric label="6h" value="74%" />
              <Metric label="12h" value="81%" />
              <Metric label="24h" value="78%" />
            </div>

            {/* DRIVERS */}
            <div className="mt-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                Primary drivers
              </p>

              <div className="mt-3 space-y-2.5">
                <Driver text="146 mm rainfall in the last 6 hours" />
                <Driver text="82 mm antecedent rainfall" />
                <Driver text="12-hour projected risk peak" />
              </div>
            </div>

            {/* GEMMA BUTTON */}
            <button
              onClick={explainWithGemma}
              disabled={loading}
              className="mt-7 w-full rounded-xl bg-orange-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Gemma is analyzing..." : "Explain with Gemma 4"}
            </button>
          </section>

          {/* GEMMA */}
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white">
                  AI
                </div>

                <div>
                  <h2 className="text-lg font-bold text-neutral-950">
                    Gemma Intelligence Layer
                  </h2>

                  <p className="text-xs text-stone-500">
                    Reasoning & communication
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                GEMMA 4
              </span>
            </div>

            {!result && !error && !loading && (
              <div className="mt-6 flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/70 p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                  <span className="text-xl">✦</span>
                </div>

                <p className="mt-5 text-base font-semibold text-neutral-800">
                  Explain the current forecast
                </p>

                <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
                  Ask Gemma to translate the structured forecast into
                  operational reasoning and a recommended next step.
                </p>
              </div>
            )}

            {loading && (
              <div className="mt-6 flex min-h-[360px] items-center justify-center rounded-2xl border border-orange-100 bg-orange-50/50 p-8 text-center">
                <div>
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />

                  <p className="mt-5 text-sm font-semibold text-orange-700">
                    Analyzing forecast context...
                  </p>

                  <p className="mt-1 text-xs text-stone-500">
                    Gemma is preparing a grounded explanation.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
                <p className="font-semibold text-red-700">
                  AI unavailable
                </p>

                <p className="mt-2 text-sm leading-6 text-red-600">
                  {error}
                </p>
              </div>
            )}

            {result && (
              <div className="mt-6 space-y-5">
                <InsightBlock title="Summary">
                  <p className="leading-7 text-stone-700">
                    {result.summary}
                  </p>
                </InsightBlock>

                <InsightBlock title="Why the model is concerned">
                  <div className="space-y-2">
                    {result.why.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </InsightBlock>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    Uncertainty
                  </p>

                  <p className="mt-2 text-sm leading-6 text-amber-900/80">
                    {result.uncertainty}
                  </p>
                </div>

                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-orange-700">
                    Recommended next step
                  </p>

                  <p className="mt-2 text-sm leading-6 text-orange-950/80">
                    {result.action}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* WHAT IF */}
        <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-700">
                  Simulator
                </span>

                <span className="text-xs text-stone-400">
                  Decision support
                </span>
              </div>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950">
                What-If Rainfall Scenario
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
                Explore how increased rainfall could change the projected
                scenario and ask Gemma to explain the operational implication.
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 px-5 py-4 text-left lg:min-w-[150px] lg:text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Baseline risk
              </p>

              <p className="mt-1 text-3xl font-bold text-neutral-950">
                81%
              </p>
            </div>
          </div>

          {/* SLIDER */}
          <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-neutral-800">
                  6-hour rainfall
                </p>

                <p className="mt-1 text-xs text-stone-500">
                  Adjust the scenario input
                </p>
              </div>

              <span className="text-2xl font-bold text-orange-600">
                {rainfall} mm
              </span>
            </div>

            <input
              type="range"
              min="146"
              max="220"
              step="1"
              value={rainfall}
              onChange={(e) => setRainfall(Number(e.target.value))}
              className="mt-6 w-full accent-orange-600"
            />

            <div className="mt-2 flex justify-between text-xs text-stone-400">
              <span>146 mm</span>
              <span>220 mm</span>
            </div>
          </div>

          <button
            onClick={runScenario}
            disabled={scenarioLoading}
            className="mt-5 rounded-xl border border-orange-600 bg-white px-6 py-3 text-sm font-bold text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {scenarioLoading
              ? "Gemma is analyzing scenario..."
              : "Run What-If Scenario"}
          </button>

          {scenarioError && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-600">{scenarioError}</p>
            </div>
          )}

          {scenarioResult && (
            <div className="mt-7 grid gap-5 lg:grid-cols-2">
              {/* COMPARISON */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Scenario comparison
                </p>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-stone-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                      Baseline
                    </p>

                    <p className="mt-2 text-3xl font-bold text-neutral-950">
                      81%
                    </p>

                    <p className="mt-1 text-sm text-stone-500">
                      146 mm rainfall
                    </p>
                  </div>

                  <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                      Scenario
                    </p>

                    <p className="mt-2 text-3xl font-bold text-orange-600">
                      {scenarioData
                        ? `${Math.round(
                            scenarioData.scenario_risk_12h * 100
                          )}%`
                        : "--"}
                    </p>

                    <p className="mt-1 text-sm text-orange-800/70">
                      {scenarioData
                        ? `${scenarioData.scenario_rainfall_6h_mm} mm`
                        : `${rainfall} mm`}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-stone-200 pt-4">
                  <div>
                    <p className="text-xs text-stone-400">
                      Risk change
                    </p>

                    <p className="mt-1 text-lg font-bold text-orange-600">
                      {scenarioData
                        ? `+${Math.round(
                            scenarioData.risk_change * 100
                          )} pp`
                        : "--"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-stone-400">
                      Projected onset
                    </p>

                    <p className="mt-1 text-lg font-bold text-neutral-900">
                      {scenarioData
                        ? `~${scenarioData.scenario_onset_hours}h`
                        : "--"}
                    </p>
                  </div>
                </div>
              </div>

              {/* GEMMA SCENARIO */}
              <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-neutral-900 px-2 py-1 text-xs font-bold text-white">
                    GEMMA 4
                  </span>

                  <span className="text-xs font-medium text-stone-500">
                    Scenario reasoning
                  </span>
                </div>

                <p className="mt-4 leading-7 text-stone-700">
                  {scenarioResult.summary}
                </p>

                <div className="mt-4 space-y-2">
                  {scenarioResult.why.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm leading-6 text-stone-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t border-orange-200 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    Uncertainty
                  </p>

                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {scenarioResult.uncertainty}
                  </p>
                </div>

                <div className="mt-5 border-t border-orange-200 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-orange-700">
                    Operational implication
                  </p>

                  <p className="mt-2 text-sm leading-6 text-stone-700">
                    {scenarioResult.action}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="py-8 text-center">
          <p className="text-xs text-stone-400">
            UNRAVEL AI · Decision support, not autonomous emergency control
          </p>
        </footer>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-orange-200 bg-orange-50"
          : "border-stone-200 bg-white"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-bold ${
          highlight ? "text-orange-600" : "text-neutral-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Driver({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
      <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />
      {text}
    </div>
  );
}

function InsightBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
        {title}
      </p>

      <div className="mt-3">{children}</div>
    </div>
  );
}