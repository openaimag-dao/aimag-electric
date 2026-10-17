/** Takes items round-robin across several ordered lists, up to `limit` total — so one long list doesn't crowd out the others. */
export function roundRobinTake<T>(lists: T[][], limit: number): T[] {
  const result: T[] = [];
  for (let i = 0; result.length < limit && lists.some((l) => i < l.length); i++) {
    for (const list of lists) {
      if (result.length >= limit) break;
      if (i < list.length) result.push(list[i]);
    }
  }
  return result;
}
