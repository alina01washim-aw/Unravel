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

export default function Home() {
  const [result, setResult] = useState<GemmaResult | null>(null);
  const [scenarioResult, setScenarioResult] =
    useState<ScenarioResult | null>(null);
  const [scenarioData, setScenarioData] = useState<{
    scenario_risk_6h: number;
    scenario_risk_12h: number;
    scenario_risk_24h: number;
    scenario_onset_hours: number;
    baseline_risk: number;
    scenario_rainfall_6h_mm: number;
    rainfall_change_mm: number;
    risk_change: number;
} | null>(null);

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
      const response = await fetch(
        "/api/scenario",
        {
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
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.detail || "Scenario request failed"
        );
      }

      const data = await response.json();
      setScenarioData(data.scenario);
      setScenarioResult(data.result);

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
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-50">
      <div className="mx-auto max-w-6xl">

        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            UNRAVEL AI
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Flood Intelligence Control Room
          </h1>

          <p className="mt-3 max-w-3xl text-slate-400">
            Predict future flood risk, understand why it changed,
            simulate conditions, and prepare before impact.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* FORECAST */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Forecast Zone
                </p>

                <h2 className="mt-1 text-2xl font-semibold">
                  Ward 17
                </h2>
              </div>

              <span className="rounded-full border border-red-900 bg-red-950 px-3 py-1 text-xs font-semibold text-red-300">
                ALERT
              </span>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Metric label="Current Risk" value="81%" />
              <Metric label="6h" value="74%" />
              <Metric label="12h" value="81%" />
              <Metric label="24h" value="78%" />
            </div>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">

              <p className="text-sm text-slate-400">
                Estimated onset
              </p>

              <p className="mt-1 text-2xl font-semibold">
                ~8 hours
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Confidence: moderate
              </p>

            </div>

            <div className="mt-6">

              <p className="mb-3 text-sm font-medium text-slate-300">
                Primary drivers
              </p>

              <div className="space-y-2">

                <Driver text="146 mm rainfall in the last 6 hours" />

                <Driver text="82 mm antecedent rainfall" />

                <Driver text="12-hour projected risk peak" />

              </div>

            </div>

            <button
              onClick={explainWithGemma}
              disabled={loading}
              className="mt-8 w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Gemma is analyzing..."
                : "Explain with Gemma 4"}
            </button>

          </section>


          {/* GEMMA */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex items-center gap-2">

              <span className="rounded-md bg-purple-500/10 px-2 py-1 text-xs font-semibold text-purple-300">
                AI
              </span>

              <h2 className="text-lg font-semibold">
                Gemma Intelligence Layer
              </h2>

            </div>

            {!result && !error && !loading && (

              <div className="mt-10 rounded-xl border border-dashed border-slate-700 p-8 text-center">

                <p className="text-slate-300">
                  Ask Gemma why this zone is at risk.
                </p>

              </div>

            )}

            {loading && (

              <div className="mt-10 rounded-xl border border-slate-800 p-8">

                <p className="text-purple-300">
                  Analyzing forecast context...
                </p>

              </div>

            )}

            {error && (

              <div className="mt-6 rounded-xl border border-red-900 bg-red-950/40 p-5">

                <p className="font-medium text-red-300">
                  AI unavailable
                </p>

                <p className="mt-2 text-sm text-red-400">
                  {error}
                </p>

              </div>

            )}

            {result && (

              <div className="mt-6 space-y-6">

                <div>

                  <p className="text-sm font-medium text-slate-400">
                    Summary
                  </p>

                  <p className="mt-2 leading-7 text-slate-200">
                    {result.summary}
                  </p>

                </div>

                <div>

                  <p className="text-sm font-medium text-slate-400">
                    Why the model is concerned
                  </p>

                  <div className="mt-3 space-y-2">

                    {result.why.map(
                      (item, index) => (

                        <div
                          key={index}
                          className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300"
                        >
                          {item}
                        </div>

                      )
                    )}

                  </div>

                </div>

                <div className="rounded-xl border border-purple-900/60 bg-purple-950/20 p-4">

                  <p className="text-sm font-medium text-purple-300">
                    Uncertainty
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    {result.uncertainty}
                  </p>

                </div>

                <div className="rounded-xl border border-cyan-900/60 bg-cyan-950/20 p-4">

                  <p className="text-sm font-medium text-cyan-300">
                    Recommended next step
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    {result.action}
                  </p>

                </div>

              </div>

            )}

          </section>


          {/* WHAT IF */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">

            <div className="flex items-center justify-between">

              <div>

                <span className="rounded-md bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-300">
                  SIMULATOR
                </span>

                <h2 className="mt-3 text-2xl font-semibold">
                  What-If Rainfall Scenario
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Explore how increased rainfall could change
                  the projected risk.
                </p>

              </div>

              <div className="text-right">

                <p className="text-sm text-slate-500">
                  Baseline
                </p>

                <p className="text-3xl font-bold">
                  81%
                </p>

              </div>

            </div>


            <div className="mt-8">

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-400">
                  6-hour rainfall
                </span>

                <span className="text-xl font-semibold">
                  {rainfall} mm
                </span>

              </div>

              <input
                type="range"
                min="146"
                max="220"
                step="1"
                value={rainfall}
                onChange={(e) =>
                  setRainfall(Number(e.target.value))
                }
                className="mt-5 w-full accent-cyan-400"
              />

              <div className="mt-2 flex justify-between text-xs text-slate-600">
                <span>146 mm</span>
                <span>220 mm</span>
              </div>

            </div>


            <button
              onClick={runScenario}
              disabled={scenarioLoading}
              className="mt-6 rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-6 py-3 font-semibold text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
            >
              {scenarioLoading
                ? "Gemma is analyzing scenario..."
                : "Run What-If Scenario"}
            </button>


            {scenarioError && (

              <div className="mt-5 rounded-xl border border-red-900 bg-red-950/40 p-4">

                <p className="text-sm text-red-300">
                  {scenarioError}
                </p>

              </div>

            )}


            {scenarioResult && (

              <div className="mt-8 grid gap-5 lg:grid-cols-2">

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

                  <p className="text-sm text-slate-500">
                    Scenario comparison
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-4">

                    <div>

                      <p className="text-xs text-slate-500">
                        Baseline
                      </p>

                      <p className="mt-1 text-3xl font-bold">
                        81%
                      </p>

                      <p className="text-sm text-slate-500">
                        146 mm
                      </p>

                    </div>

                    <div>

                      <p className="text-xs text-slate-500">
                        Scenario
                      </p>
                      <p className="mt-1 text-3xl font-bold text-red-300">
                        {scenarioData
                          ? `${Math.round(scenarioData.scenario_risk_12h * 100)}%`
                          : "--"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {scenarioData
                          ? `${scenarioData.scenario_rainfall_6h_mm} mm`
                          : `${rainfall} mm`}
                      </p>
                      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                      <div>
                        <p className="text-xs text-slate-500">Risk change</p>
                        <p className="mt-1 text-lg font-semibold text-red-300">
                          {scenarioData
                            ? `+${Math.round(scenarioData.risk_change * 100)} pp`
                            : "--"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Projected onset</p>
                        <p className="mt-1 text-lg font-semibold">
                          {scenarioData
                            ? `~${scenarioData.scenario_onset_hours}h`
                            : "--"}
                        </p>
                      </div>
                    </div>

                    </div>

                  </div>

                </div>


                <div className="rounded-xl border border-purple-900/60 bg-purple-950/20 p-5">

                  <div className="flex items-center gap-2">

                    <span className="rounded-md bg-purple-500/10 px-2 py-1 text-xs font-semibold text-purple-300">
                      GEMMA 4
                    </span>

                    <span className="text-xs text-slate-500">
                      Scenario reasoning
                    </span>

                  </div>

                  <p className="mt-4 leading-7 text-slate-200">
                    {scenarioResult.summary}
                  </p>

                  <div className="mt-4 space-y-2">

                    {scenarioResult.why.map(
                      (item, index) => (

                        <div
                          key={index}
                          className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300"
                        >
                          {item}
                        </div>

                      )
                    )}

                  </div>

                  <div className="mt-4">

                    <p className="text-xs font-medium uppercase tracking-wider text-purple-300">
                      Uncertainty
                    </p>

                    <p className="mt-2 text-sm text-slate-300">
                      {scenarioResult.uncertainty}
                    </p>

                  </div>

                  <div className="mt-4">

                    <p className="text-xs font-medium uppercase tracking-wider text-cyan-300">
                      Operational implication
                    </p>

                    <p className="mt-2 text-sm text-slate-300">
                      {scenarioResult.action}
                    </p>

                  </div>

                </div>

              </div>

            )}

          </section>

        </div>

      </div>
    </main>
  );
}


function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
}


function Driver({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
      {text}
    </div>
  );
}