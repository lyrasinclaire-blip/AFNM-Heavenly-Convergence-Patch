import type {
  Breakthrough,
  Buff,
  BuffEffect,
  CondensationArtItem,
  Item,
  ModAPI,
  PhysicalStatistic,
  Scaling,
  SocialStatistic,
} from 'afnm-types';

type RuntimeBuff = Omit<Buff, 'stats'> & {
  stats?: Record<string, Scaling | undefined>;
};

type RuntimeCombatBuffEntry = {
  buff: RuntimeBuff;
  buffStacks: Scaling;
};

type RuntimeCondensationArtItem = Omit<
  CondensationArtItem,
  'combatBuffs' | 'condenseCost' | 'producedDroplets'
> & { combatBuffs?: RuntimeCombatBuffEntry[] } & Partial<
    Pick<CondensationArtItem, 'condenseCost' | 'producedDroplets'>
  > &
  Record<string, unknown>;

export type HeavenlyConvergencePatchStatus = {
  attempts: number;
  applied: boolean;
  reason: string;
  sourceArtsFound: number;
  patchedAt?: string;
};

type PatchLogger = (message: string, ...args: unknown[]) => void;

const HEAVENLY_ART_NAME = 'Heavenly Convergence Art';
const HEAVENLY_BREAKTHROUGH_NAME = 'Heavenly Convergence';
const HEAVENLY_BUFF_NAME = 'Heavenly Convergence';
const RESONANCE_BUFF_NAME = 'Convergent Resonance';
const PATCH_MARKER_KEY = `${MOD_METADATA.name}.heavenlyConvergencePatch`;

const SOURCE_ART_NAMES = [
  'Mortal Condensation Art',
  'Cycle Of Nine Art',
  'Eternal Immolation Art',
  'The Distilling Furnace Art',
] as const;

const COMBAT_BUFF_SOURCE_ART_NAMES = [
  'Cycle Of Nine Art',
  'Eternal Immolation Art',
  'The Distilling Furnace Art',
] as const;

const PHYSICAL_STATS: PhysicalStatistic[] = [
  'meridians',
  'dantian',
  'muscles',
  'flesh',
  'eyes',
  'digestion',
];

const SOCIAL_STATS: SocialStatistic[] = [
  'age',
  'lifespan',
  'charisma',
  'battlesense',
  'craftskill',
  'artefactslots',
  'talismanslots',
  'condenseEfficiency',
  'pillsPerRound',
];

const RETRY_DELAYS_MS = [0, 100, 500, 2_000, 5_000] as const;

let attempts = 0;
let scheduled = false;
let lastStatus: HeavenlyConvergencePatchStatus = {
  attempts: 0,
  applied: false,
  reason: 'not-run',
  sourceArtsFound: 0,
};

export function getHeavenlyConvergencePatchStatus() {
  return { ...lastStatus };
}

export function installHeavenlyConvergencePatch(
  modApi: ModAPI,
  isEnabled: () => boolean,
  log: PatchLogger,
) {
  if (!isEnabled()) {
    lastStatus = {
      attempts,
      applied: false,
      reason: 'disabled',
      sourceArtsFound: 0,
    };
    return;
  }

  attemptPatch(modApi, log, false);

  if (scheduled) {
    return;
  }

  scheduled = true;
  for (const delay of RETRY_DELAYS_MS) {
    window.setTimeout(() => {
      if (isEnabled()) {
        attemptPatch(
          modApi,
          log,
          delay === RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1],
        );
      }
    }, delay);
  }
}

export function patchHeavenlyConvergenceNow(modApi: ModAPI, log: PatchLogger) {
  return attemptPatch(modApi, log, true);
}

function attemptPatch(modApi: ModAPI, log: PatchLogger, logFailures: boolean) {
  attempts += 1;
  const wasApplied = lastStatus.applied;

  const result = patchHeavenlyConvergence(modApi);
  lastStatus = {
    attempts,
    applied: result.applied,
    reason: result.reason,
    sourceArtsFound: result.sourceArtsFound,
    patchedAt: result.applied ? new Date().toISOString() : lastStatus.patchedAt,
  };

  if (result.applied && !wasApplied) {
    log('Patched Heavenly Convergence Art.', {
      sourceArtsFound: result.sourceArtsFound,
      statChange: result.art?.statChange,
      maxDroplets: result.art?.maxDroplets,
      restoredDroplets: result.art?.restoredDroplets,
      combatBuffs: result.art?.combatBuffs?.map((entry) => entry.buff.name),
    });
  } else if (logFailures) {
    console.warn(
      `[${MOD_METADATA.name}] Heavenly Convergence patch not applied: ${result.reason}`,
    );
  }

  return { ...lastStatus };
}

function patchHeavenlyConvergence(modApi: ModAPI) {
  const items = modApi.gameData?.items;
  const baseArt = getCondensationArt(items, HEAVENLY_ART_NAME);

  if (!items || !baseArt) {
    return {
      applied: false,
      reason: `${HEAVENLY_ART_NAME} is not registered yet`,
      sourceArtsFound: 0,
    };
  }

  const sourceArts = SOURCE_ART_NAMES.map((name) =>
    getCondensationArt(items, name),
  ).filter((art): art is RuntimeCondensationArtItem => Boolean(art));

  const patchedArt = buildPatchedArt(baseArt, sourceArts, items);
  items[HEAVENLY_ART_NAME] = patchedArt as unknown as Item;

  patchBreakthrough(modApi, patchedArt);

  return {
    applied: true,
    reason: 'applied',
    sourceArtsFound: sourceArts.length,
    art: patchedArt,
  };
}

function getCondensationArt(
  items: Record<string, Item> | undefined,
  name: string,
): RuntimeCondensationArtItem | undefined {
  const item = items?.[name];
  return item?.kind === 'condensation_art'
    ? (item as RuntimeCondensationArtItem)
    : undefined;
}

function buildPatchedArt(
  baseArt: RuntimeCondensationArtItem,
  sourceArts: RuntimeCondensationArtItem[],
  items: Record<string, Item>,
): RuntimeCondensationArtItem {
  const cycleOfNineArt = getCondensationArt(items, 'Cycle Of Nine Art');
  const statChange =
    sourceArts.length > 0 ? sumPhysicalStats(sourceArts) : baseArt.statChange;
  const socialStatsChange =
    sourceArts.length > 0
      ? sumSocialStats(sourceArts)
      : baseArt.socialStatsChange;
  const combatBuffs = buildCombinedCombatBuff(items, baseArt);
  const craftingBuffs = sourceArts.flatMap((art) => art.craftingBuffs ?? []);
  const maxDroplets =
    sourceArts.length > 0
      ? Math.max(...sourceArts.map((art) => art.maxDroplets ?? 0))
      : baseArt.maxDroplets;
  const restoredDroplets =
    sourceArts.length > 0
      ? sumNumbers(sourceArts.map((art) => art.restoredDroplets ?? 0))
      : (baseArt.restoredDroplets ?? 0);
  const charismaMult =
    sourceArts.length > 0
      ? Math.max(1, ...sourceArts.map((art) => art.charismaMult ?? 1))
      : baseArt.charismaMult;
  const lifespanMult =
    sourceArts.length > 0
      ? Math.max(1, ...sourceArts.map((art) => art.lifespanMult ?? 1))
      : baseArt.lifespanMult;

  const patchedArt: RuntimeCondensationArtItem = {
    ...baseArt,
    artName: 'Heavenly Convergence',
    patternBg: baseArt.patternBg || cycleOfNineArt?.patternBg || '',
    patternOpacity: Math.max(
      baseArt.patternOpacity ?? 0,
      ...sourceArts.map((art) => art.patternOpacity ?? 0),
    ),
    icon: baseArt.icon || cycleOfNineArt?.icon || '',
    maxDroplets,
    statChange,
    charismaMult,
    lifespanMult,
    [PATCH_MARKER_KEY]: true,
  };

  if (Object.keys(socialStatsChange ?? {}).length > 0) {
    patchedArt.socialStatsChange = socialStatsChange;
  } else {
    delete patchedArt.socialStatsChange;
  }

  if (restoredDroplets > 0) {
    patchedArt.restoredDroplets = restoredDroplets;
  } else {
    delete patchedArt.restoredDroplets;
  }

  if (combatBuffs.length > 0) {
    patchedArt.combatBuffs = cloneData(combatBuffs);
  } else {
    delete patchedArt.combatBuffs;
  }

  if (craftingBuffs.length > 0) {
    patchedArt.craftingBuffs = cloneData(craftingBuffs);
  } else {
    delete patchedArt.craftingBuffs;
  }

  delete patchedArt.condenseCost;
  delete patchedArt.producedDroplets;
  delete patchedArt.hpCost;
  delete patchedArt.moneyCost;

  return patchedArt;
}

function buildCombinedCombatBuff(
  items: Record<string, Item>,
  baseArt: RuntimeCondensationArtItem,
): RuntimeCombatBuffEntry[] {
  const sourceBuffs = COMBAT_BUFF_SOURCE_ART_NAMES.flatMap(
    (name) => getCondensationArt(items, name)?.combatBuffs ?? [],
  );

  if (sourceBuffs.length === 0) {
    return baseArt.combatBuffs ?? [];
  }

  const cycleBuff = sourceBuffs.find((entry) =>
    entry.buff.triggeredBuffEffects?.some(
      (effect) => effect.trigger === 'consume.qiDroplets',
    ),
  );
  const furnaceBuff = sourceBuffs.find((entry) =>
    hasRuntimeStat(entry.buff, 'dropletBoost'),
  );
  const eternalBuff = sourceBuffs.find((entry) =>
    hasRuntimeStat(entry.buff, 'excessDropletsCost'),
  );
  const stats = {
    ...(furnaceBuff?.buff.stats ?? {}),
    ...(eternalBuff?.buff.stats ?? {}),
  };
  const icon =
    baseArt.icon ||
    cycleBuff?.buff.icon ||
    furnaceBuff?.buff.icon ||
    eternalBuff?.buff.icon ||
    '';

  return [
    {
      buff: {
        name: HEAVENLY_BUFF_NAME,
        icon,
        canStack: false,
        stats: Object.keys(stats).length > 0 ? stats : undefined,
        tooltip: buildResonanceGainTooltip(),
        triggeredBuffEffects: cycleBuff?.buff.triggeredBuffEffects
          ? cloneData(cycleBuff.buff.triggeredBuffEffects).map((trigger) => ({
              ...trigger,
              effects: trigger.effects.map(renameResonanceBuffEffect),
            }))
          : undefined,
        stacks: 1,
      },
      buffStacks: { value: 1, stat: undefined },
    },
  ];
}

function hasRuntimeStat(buff: RuntimeBuff, stat: string) {
  return buff.stats?.[stat] !== undefined;
}

function buildResonanceGainTooltip() {
  return `Each time you consume a <name>Qi Droplet</name>, gain <num>1</num> stack of <name>${RESONANCE_BUFF_NAME}</name>.`;
}

function renameResonanceBuffEffect(effect: BuffEffect): BuffEffect {
  if (effect.kind !== 'buffSelf') {
    return effect;
  }

  const buff = {
    ...effect.buff,
    name: RESONANCE_BUFF_NAME,
  };
  delete buff.tooltip;
  delete buff.additionalTooltip;
  delete buff.statsTooltip;
  delete buff.effectHint;

  return {
    ...effect,
    buff,
  };
}

function sumPhysicalStats(sourceArts: RuntimeCondensationArtItem[]) {
  const result: Partial<Record<PhysicalStatistic, number>> = {};

  for (const stat of PHYSICAL_STATS) {
    const total = sumNumbers(
      sourceArts.map((art) => art.statChange?.[stat] ?? 0),
    );
    if (total !== 0) {
      result[stat] = total;
    }
  }

  return result;
}

function sumSocialStats(sourceArts: RuntimeCondensationArtItem[]) {
  const result: Partial<Record<SocialStatistic, number>> = {};

  for (const stat of SOCIAL_STATS) {
    const total = sumNumbers(
      sourceArts.map((art) => art.socialStatsChange?.[stat] ?? 0),
    );
    if (total !== 0) {
      result[stat] = total;
    }
  }

  return result;
}

function sumNumbers(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function patchBreakthrough(
  modApi: ModAPI,
  patchedArt: RuntimeCondensationArtItem,
) {
  const breakthrough = modApi.gameData?.breakthroughs?.qiCondensation?.find(
    (entry) => entry.name === HEAVENLY_BREAKTHROUGH_NAME,
  );

  if (!breakthrough) {
    return;
  }

  breakthrough.physicalStats = { ...patchedArt.statChange };
  breakthrough.socialStats = buildBreakthroughSocialStats(modApi, patchedArt);
  breakthrough.combatBuffs = toBreakthroughCombatBuffs(patchedArt.combatBuffs);
  breakthrough.craftingBuffs = patchedArt.craftingBuffs
    ? cloneData(patchedArt.craftingBuffs)
    : undefined;
  breakthrough.maxDroplets = patchedArt.maxDroplets;
  breakthrough.dropletRegen = patchedArt.restoredDroplets;
  breakthrough.dynamicStats = buildDynamicStats(patchedArt, modApi);
}

function buildDynamicStats(
  patchedArt: RuntimeCondensationArtItem,
  modApi: ModAPI,
): Breakthrough['dynamicStats'] {
  return () => ({
    physicalStats: { ...patchedArt.statChange },
    socialStats: buildBreakthroughSocialStats(modApi, patchedArt),
    combatBuffs: toBreakthroughCombatBuffs(patchedArt.combatBuffs),
    craftingBuffs: patchedArt.craftingBuffs
      ? cloneData(patchedArt.craftingBuffs)
      : undefined,
    dropletRegen: patchedArt.restoredDroplets,
    maxDroplets: patchedArt.maxDroplets,
    extraEffects: [`Condensation art: <name>${patchedArt.name}</name>`],
  });
}

function buildBreakthroughSocialStats(
  modApi: ModAPI,
  art: RuntimeCondensationArtItem,
): Partial<Record<SocialStatistic, number>> {
  return {
    lifespan: Math.floor(80 * (art.lifespanMult ?? 1)),
    charisma: modApi.utils.getBreakthroughCharisma(
      'coreFormation',
      art.charismaMult ?? 1,
    ),
  };
}

function toBreakthroughCombatBuffs(
  combatBuffs: RuntimeCombatBuffEntry[] | undefined,
): Breakthrough['combatBuffs'] {
  return combatBuffs
    ? (cloneData(combatBuffs) as unknown as Breakthrough['combatBuffs'])
    : undefined;
}

function cloneData<T>(value: T): T {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}
