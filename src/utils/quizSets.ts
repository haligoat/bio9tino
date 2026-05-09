import type { QuizItem, QuizSet } from '../types';

interface QuizEntry {
  item: QuizItem;
  originalIndex: number;
}

interface QuizGroup {
  id: string;
  entries: QuizEntry[];
}

interface BuildQuizSetsOptions {
  targetQuestionCount?: number;
  description?: string;
}

const quizSetMeta = [
  {
    id: 'quiz-1',
    title: 'Quiz 1',
    description: 'Balanced unit practice',
  },
  {
    id: 'quiz-2',
    title: 'Quiz 2',
    description: 'Balanced unit practice',
  },
  {
    id: 'quiz-3',
    title: 'Quiz 3',
    description: 'Balanced unit practice',
  },
];

const hashValue = (seed: number, value: string | number) => {
  const input = `${seed}:${value}`;
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const splitGroups = (entries: QuizEntry[], getId: (entry: QuizEntry) => string): QuizGroup[] => {
  const groups = entries.reduce((groupMap, entry) => {
    const groupId = getId(entry);
    const group = groupMap.get(groupId) ?? [];
    group.push(entry);
    groupMap.set(groupId, group);
    return groupMap;
  }, new Map<string, QuizEntry[]>());

  return [...groups.entries()].map(([id, groupEntries]) => ({ id, entries: groupEntries }));
};

const distributeCounts = (groups: QuizGroup[], targetCount: number) => {
  const availableCount = groups.reduce((total, group) => total + group.entries.length, 0);
  const cappedTargetCount = Math.min(targetCount, availableCount);
  const allocations = groups.map((group) => {
    const exactCount = availableCount === 0 ? 0 : (group.entries.length / availableCount) * cappedTargetCount;

    return {
      id: group.id,
      capacity: group.entries.length,
      count: Math.min(group.entries.length, Math.floor(exactCount)),
      remainder: exactCount % 1,
    };
  });

  let remainingCount = cappedTargetCount - allocations.reduce((total, allocation) => total + allocation.count, 0);

  while (remainingCount > 0) {
    const nextAllocation = allocations
      .filter((allocation) => allocation.count < allocation.capacity)
      .toSorted((first, second) =>
        second.remainder - first.remainder ||
        second.capacity - first.capacity ||
        first.id.localeCompare(second.id)
      )[0];

    if (!nextAllocation) break;

    nextAllocation.count += 1;
    nextAllocation.remainder = 0;
    remainingCount -= 1;
  }

  return new Map(allocations.map(({ id, count }) => [id, count]));
};

const selectEntries = (entries: QuizEntry[], targetCount: number, seed: number): QuizEntry[] => {
  const typeGroups = splitGroups(entries, (entry) => entry.item.type);
  const typeTargets = distributeCounts(typeGroups, targetCount);

  return typeGroups.flatMap((group) => {
    const groupTarget = typeTargets.get(group.id) ?? 0;

    return group.entries
      .toSorted((first, second) =>
        hashValue(seed, first.originalIndex) - hashValue(seed, second.originalIndex) ||
        first.originalIndex - second.originalIndex
      )
      .slice(0, groupTarget);
  });
};

const buildQuizItems = (items: QuizItem[], targetCount: number, quizIndex: number) => {
  const entries = items.map((item, originalIndex) => ({ item, originalIndex }));
  const unitGroups = splitGroups(entries, (entry) => entry.item.unitTitle ?? 'Current unit');
  const unitTargets = distributeCounts(unitGroups, targetCount);
  const seed = quizIndex + 1;

  return unitGroups
    .flatMap((group) => selectEntries(group.entries, unitTargets.get(group.id) ?? 0, seed))
    .toSorted((first, second) =>
      hashValue(seed + 100, first.originalIndex) - hashValue(seed + 100, second.originalIndex) ||
      first.originalIndex - second.originalIndex
    )
    .map(({ item }) => item);
};

export const buildBalancedQuizSets = (items: QuizItem[], options: BuildQuizSetsOptions = {}): QuizSet[] => {
  const targetQuestionCount = options.targetQuestionCount ?? items.length;

  return quizSetMeta.map((meta, quizIndex) => {
    const quizItems = buildQuizItems(items, targetQuestionCount, quizIndex);

    return {
      ...meta,
      description: options.description ?? meta.description,
      items: quizItems,
    };
  });
};

export const getDefaultQuizSetId = (quizSets: QuizSet[]) => quizSets[0]?.id ?? 'quiz-1';
