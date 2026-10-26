/** Alle KI-Stufen nach ID (Auswahl im Menü, Simulator, Tests). */
import type { Agent } from './agent.ts';
import { easyAgent } from './easy.ts';
import { normalAgent } from './normal.ts';

export const AGENTS = { easy: easyAgent, normal: normalAgent } as const satisfies Record<
  string,
  Agent
>;

export type AgentId = keyof typeof AGENTS;

export function isAgentId(id: string): id is AgentId {
  return id in AGENTS;
}
