import { classifyByKeywords, inferImpactUrgency, priorityFromMatrix, type SlaConfig, type Suggestion } from '@incident/shared';
import { config } from '../config';
import { logger } from '../lib/logger';

export interface AiInput {
  title: string;
  description: string;
}

// Deterministic rules/keyword classifier — the default, requires no external service.
function rulesSuggest(input: AiInput, slaConfig: SlaConfig): Suggestion {
  const text = `${input.title} ${input.description}`;
  const classification = classifyByKeywords(text);
  const { impact, urgency } = inferImpactUrgency(text);
  const priority = priorityFromMatrix(impact, urgency, slaConfig);
  return { classification, priority, source: 'rules', label: 'AI recommendation — review before applying' };
}

// Optional Bedrock adapter. Only used when AI_PROVIDER=bedrock and credentials are present.
// Falls back to rules on any error so the app always works.
async function bedrockSuggest(input: AiInput, slaConfig: SlaConfig): Promise<Suggestion> {
  try {
    // Workshop stub: a real implementation would call AWS Bedrock here using
    // credentials from the environment/secret store (never hard-coded).
    // Kept as a documented boundary; falls through to rules for the workshop.
    logger.info('Bedrock adapter not configured with a live model; using rules fallback.');
    return { ...rulesSuggest(input, slaConfig), source: 'rules' };
  } catch (err) {
    logger.warn({ err }, 'Bedrock suggestion failed; falling back to rules.');
    return rulesSuggest(input, slaConfig);
  }
}

export async function suggest(input: AiInput, slaConfig: SlaConfig): Promise<Suggestion> {
  if (config.AI_PROVIDER === 'bedrock') return bedrockSuggest(input, slaConfig);
  return rulesSuggest(input, slaConfig);
}
