export type ProblemDef = { number: number; name: string };

export function getProblemList(dp: {
  problemsData: any;
  problem1Number: number | null;
  problem1Name: string | null;
  problem2Number: number | null;
  problem2Name: string | null;
}): ProblemDef[] {
  if (dp.problemsData && Array.isArray(dp.problemsData)) {
    return dp.problemsData as ProblemDef[];
  }
  const legacy: ProblemDef[] = [];
  if (dp.problem1Number) legacy.push({ number: dp.problem1Number, name: dp.problem1Name || "" });
  if (dp.problem2Number) legacy.push({ number: dp.problem2Number, name: dp.problem2Name || "" });
  return legacy;
}
