import type { LeadDocument } from "../models/Lead";

type ScorableLead = LeadDocument & {
  _id: unknown;
};

export type LeadScore = {
  leadId: string;
  score: number;
  reason: string;
  source: "openai" | "local";
};

type OpenAILeadScore = {
  leadId: string;
  score: number;
  reason: string;
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function hasValue(value: string) {
  return Boolean(String(value || "").trim());
}

function getLocalLeadScore(lead: ScorableLead): LeadScore {
  let score = 35;
  const reasons: string[] = [];

  if (lead.googlePlaceId) {
    score += 12;
    reasons.push("verified Google place");
  }

  if (hasValue(lead.phone)) {
    score += 14;
    reasons.push("phone available");
  }

  if (hasValue(lead.website)) {
    score += 12;
    reasons.push("website available");
  }

  if (hasValue(lead.businessAddress)) {
    score += 8;
    reasons.push("address available");
  }

  if (hasValue(lead.category)) {
    score += 6;
    reasons.push(`${lead.category} category`);
  }

  if (lead.followUpAt) {
    const followUpTime = new Date(lead.followUpAt).getTime();
    const now = Date.now();

    if (!Number.isNaN(followUpTime)) {
      score += followUpTime <= now + 24 * 60 * 60 * 1000 ? 20 : 12;
      reasons.push("scheduled follow-up");
    }
  }

  if (lead.status === "Qualified") {
    score += 14;
    reasons.push("already qualified");
  } else if (lead.status === "Follow up" || lead.status === "Ongoing comms") {
    score += 8;
    reasons.push("active conversation");
  } else if (lead.status === "Dead" || lead.status === "Archived") {
    score -= 35;
    reasons.push("low-priority status");
  }

  return {
    leadId: String(lead._id),
    score: clampScore(score),
    reason: reasons.slice(0, 3).join(", ") || "basic business profile",
    source: "local",
  };
}

function getResponseText(response: { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> }) {
  if (response.output_text) {
    return response.output_text;
  }

  return (response.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .join("")
    .trim();
}

async function scoreLeadsWithOpenAI(leads: ScorableLead[]) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || leads.length === 0) {
    return [];
  }

  const model = process.env.OPENAI_LEAD_SCORING_MODEL || "gpt-5-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions:
        "Score CRM leads from 0 to 100 by sales potential. Prefer reachable, active businesses with phone/website/address and signs of fit. Return concise reasons.",
      input: JSON.stringify({
        leads: leads.map((lead) => ({
          leadId: String(lead._id),
          businessName: lead.businessName,
          businessAddress: lead.businessAddress,
          category: lead.category,
          source: lead.source,
          status: lead.status,
          phoneAvailable: hasValue(lead.phone),
          websiteAvailable: hasValue(lead.website),
          followUpAt: lead.followUpAt,
          followUpPriority: lead.followUpPriority,
          notes: lead.notes,
        })),
      }),
      text: {
        format: {
          type: "json_schema",
          name: "lead_scores",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              scores: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    leadId: { type: "string" },
                    score: { type: "number" },
                    reason: { type: "string" },
                  },
                  required: ["leadId", "score", "reason"],
                },
              },
            },
            required: ["scores"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI lead scoring failed: ${await response.text()}`);
  }

  const data = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  const parsed = JSON.parse(getResponseText(data)) as { scores?: OpenAILeadScore[] };

  return (parsed.scores || []).map((score) => ({
    leadId: score.leadId,
    score: clampScore(score.score),
    reason: String(score.reason || "").trim() || "AI-ranked lead potential",
    source: "openai" as const,
  }));
}

export async function scoreLeadsByPotential(leads: ScorableLead[]) {
  const localScores = leads.map(getLocalLeadScore);
  const scoresByLeadId = new Map(localScores.map((score) => [score.leadId, score]));
  const aiLimit = Number(process.env.OPENAI_LEAD_SCORING_LIMIT || 200);
  const aiCandidates = [...leads]
    .sort((first, second) => (scoresByLeadId.get(String(second._id))?.score || 0) - (scoresByLeadId.get(String(first._id))?.score || 0))
    .slice(0, Number.isFinite(aiLimit) && aiLimit > 0 ? aiLimit : 200);

  try {
    const aiScores = await scoreLeadsWithOpenAI(aiCandidates);
    aiScores.forEach((score) => scoresByLeadId.set(score.leadId, score));
  } catch (error) {
    console.warn(error);
  }

  return Array.from(scoresByLeadId.values()).sort((first, second) => second.score - first.score);
}
