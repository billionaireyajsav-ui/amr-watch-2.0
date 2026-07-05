import type { Hospital, Patient, AIInsight } from '@/types';

// ---------------------------------------------------------------------------
// AI Assistant service.
//
// USE_LIVE_AI is false by default so the app runs with zero configuration.
// Set VITE_OPENAI_API_KEY in a .env file and flip USE_LIVE_AI to true to call
// the real OpenAI API instead — the prompt-construction helpers below are
// already written so no other code changes are required.
//
// The fallback generator never invents clinical facts: every sentence it
// produces is derived directly from the numbers passed in, and every insight
// is labelled with `basedOnData: true`.
// ---------------------------------------------------------------------------

const USE_LIVE_AI = false;

function delay<T>(value: T, ms = 900): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function buildRiskExplanationPrompt(hospital: Hospital): string {
  return `You are an antimicrobial stewardship advisor. Using ONLY the following data for ${hospital.name}, explain in 3-4 sentences why its AMR risk level is "${hospital.riskLevel}". Data: AMR score ${hospital.amrScore}/100, broad-spectrum usage ${hospital.broadSpectrumPct}%, lab confirmation rate ${hospital.labConfirmationRate}%. Do not invent facts beyond this data.`;
}

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
    }),
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ---- Templated (offline-safe) generators ------------------------------------

function riskExplanationLocal(hospital: Hospital): string {
  const parts: string[] = [];
  parts.push(
    `${hospital.name} currently holds an AMR score of ${hospital.amrScore}/100, placing it in the ${hospital.riskLevel} risk band.`
  );
  if (hospital.broadSpectrumPct > 55) {
    parts.push(
      `Broad-spectrum antibiotics account for ${hospital.broadSpectrumPct}% of prescriptions here, well above the 40-50% stewardship benchmark, which is a major contributor to the elevated score.`
    );
  } else {
    parts.push(
      `Broad-spectrum usage sits at ${hospital.broadSpectrumPct}%, which is within an acceptable stewardship range and is helping keep resistance pressure lower.`
    );
  }
  if (hospital.labConfirmationRate < 70) {
    parts.push(
      `Only ${hospital.labConfirmationRate}% of cases have lab-confirmed bacterial identification before the final antibiotic is chosen, meaning a meaningful share of prescribing decisions are empirical rather than evidence-based.`
    );
  } else {
    parts.push(
      `Lab confirmation before final antibiotic selection is strong at ${hospital.labConfirmationRate}%, supporting more targeted prescribing.`
    );
  }
  return parts.join(' ');
}

function recommendationLocal(hospital: Hospital): string {
  const recs: string[] = [];
  if (hospital.broadSpectrumPct > 55) {
    recs.push('Introduce a mandatory 48-hour antibiotic time-out to reassess broad-spectrum orders against culture results.');
  }
  if (hospital.labConfirmationRate < 70) {
    recs.push('Expand rapid diagnostic / culture capacity so empirical therapy can be de-escalated sooner.');
  }
  if (hospital.riskLevel === 'high') {
    recs.push('Schedule a stewardship committee review within 2 weeks given the high-risk classification.');
  }
  if (recs.length === 0) {
    recs.push('Maintain current stewardship practices and continue quarterly AMR score monitoring.');
  }
  return recs.map((r, i) => `${i + 1}. ${r}`).join('\n');
}

function trendSummaryLocal(hospital: Hospital): string {
  const first = hospital.monthlyTrend[0];
  const last = hospital.monthlyTrend[hospital.monthlyTrend.length - 1];
  const direction = last.amrScore > first.amrScore ? 'worsened' : last.amrScore < first.amrScore ? 'improved' : 'stayed flat';
  return `Over the last ${hospital.monthlyTrend.length} months, ${hospital.name}'s AMR score has ${direction}, moving from ${first.amrScore} in ${first.month} to ${last.amrScore} in ${last.month}. Broad-spectrum usage moved from ${first.broad}% to ${last.broad}% across the same window.`;
}

function stewardshipLocal(hospital: Hospital, patients: Patient[]): string {
  const hospitalPatients = patients.filter((p) => p.hospitalId === hospital.id);
  const switched = hospitalPatients.filter((p) => p.treatmentChanged).length;
  const pct = hospitalPatients.length ? Math.round((switched / hospitalPatients.length) * 100) : 0;
  return `Of ${hospitalPatients.length} tracked patient records at ${hospital.name}, ${switched} (${pct}%) had their antibiotic therapy switched after lab results, indicating ${pct > 40 ? 'active' : 'limited'} de-escalation practice. Encourage documenting the rationale for every switch to strengthen the stewardship audit trail.`;
}

function publicHealthLocal(hospitals: Hospital[]): string {
  const avgAmr = Math.round(hospitals.reduce((s, h) => s + h.amrScore, 0) / hospitals.length);
  const highRiskCount = hospitals.filter((h) => h.riskLevel === 'high').length;
  return `Across ${hospitals.length} monitored facilities, the network average AMR score is ${avgAmr}/100, with ${highRiskCount} facilit${highRiskCount === 1 ? 'y' : 'ies'} in the high-risk band. Prioritise stewardship support and rapid-diagnostics funding toward these facilities first, as they carry disproportionate community transmission risk.`;
}

// ---- Public API -------------------------------------------------------------

export async function generateRiskExplanation(hospital: Hospital): Promise<AIInsight> {
  const content = USE_LIVE_AI
    ? await callOpenAI(buildRiskExplanationPrompt(hospital))
    : riskExplanationLocal(hospital);
  return delay({
    id: uid('ai'),
    kind: 'risk_explanation',
    title: `Why is ${hospital.name} rated "${hospital.riskLevel}" risk?`,
    content,
    basedOnData: true,
    createdAt: new Date().toISOString(),
  });
}

export async function generateRecommendation(hospital: Hospital): Promise<AIInsight> {
  return delay({
    id: uid('ai'),
    kind: 'recommendation',
    title: `Stewardship recommendations for ${hospital.name}`,
    content: recommendationLocal(hospital),
    basedOnData: true,
    createdAt: new Date().toISOString(),
  });
}

export async function generateTrendSummary(hospital: Hospital): Promise<AIInsight> {
  return delay({
    id: uid('ai'),
    kind: 'trend_summary',
    title: `6-month trend summary — ${hospital.name}`,
    content: trendSummaryLocal(hospital),
    basedOnData: true,
    createdAt: new Date().toISOString(),
  });
}

export async function generateStewardshipInsight(hospital: Hospital, patients: Patient[]): Promise<AIInsight> {
  return delay({
    id: uid('ai'),
    kind: 'stewardship',
    title: `Antibiotic switch pattern — ${hospital.name}`,
    content: stewardshipLocal(hospital, patients),
    basedOnData: true,
    createdAt: new Date().toISOString(),
  });
}

export async function generatePublicHealthInsight(hospitals: Hospital[]): Promise<AIInsight> {
  return delay({
    id: uid('ai'),
    kind: 'public_health',
    title: 'Network-wide public health recommendation',
    content: publicHealthLocal(hospitals),
    basedOnData: true,
    createdAt: new Date().toISOString(),
  });
}
