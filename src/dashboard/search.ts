import type { Instruction } from "../types";

export function matchesSearch(instr: Instruction, search: string): boolean {
  if (!search.trim()) return true;
  const needle = search.trim().toLowerCase();
  return instr.content.toLowerCase().includes(needle) || (instr.alias?.toLowerCase().includes(needle) ?? false);
}
