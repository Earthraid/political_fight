export type Team = "RED" | "BLUE";

export type CharacterId =
  | "Rump"
  | "Balderdash"
  | "Morono"
  | "Prance"
  | "NormalHumanRed"
  | "Shoe"
  | "Nandy"
  | "Jeppy"
  | "Cinema"
  | "NormalHumanBlue";

export type CharacterStats = {
  walkSpeed: number;
  jumpVelocity: number;
  maxHP: number;
};

export type MoveData = {
  name: string;
  startup: number;
  active: number;
  recovery: number;
  knockback: number;
  notes?: string;
};

export type CharacterDefinition = {
  id: CharacterId;
  team: Team;
  displayName: string;
  portraitPath: string;
  spritePath: string;
  stats: CharacterStats;
  moves: {
    normal: MoveData;
    special: MoveData;
  };
};

const portraitPath = (id: CharacterId) => `characters/${id}_portrait.svg`;
const spritePath = (id: CharacterId) => `characters/${id}_sprite.svg`;

const makeCharacter = (
  id: CharacterId,
  team: Team,
  stats: CharacterStats,
  moves: CharacterDefinition["moves"],
  displayName?: string
): CharacterDefinition => ({
  id,
  team,
  displayName: displayName ?? id,
  portraitPath: portraitPath(id),
  spritePath: spritePath(id),
  stats,
  moves,
});

const characterList: CharacterDefinition[] = [
  makeCharacter(
    "Rump",
    "RED",
    { walkSpeed: 1.2, jumpVelocity: 2, maxHP: 12 },
    {
      normal: { name: "Stupid Nickname", startup: 4, active: 2, recovery: 10, knockback: 4 },
      special: {
        name: "Faux Patriotism",
        startup: 8,
        active: 4,
        recovery: 14,
        knockback: 12,
        notes: "Literally kiss a flag.",
      },
    }
  ),
  makeCharacter(
    "Balderdash",
    "RED",
    { walkSpeed: 4.0, jumpVelocity: 5, maxHP: 130 },
    {
      normal: { name: "Walk in Parade", startup: 5, active: 2, recovery: 11, knockback: 5 },
      special: {
        name: "Simp for Big Oil",
        startup: 6,
        active: 6,
        recovery: 13,
        knockback: 7,
        notes: "Poison communities for the 'greater good'..",
      },
    }
  ),
  makeCharacter(
    "Morono",
    "RED",
    { walkSpeed: 3.7, jumpVelocity: 7, maxHP: 115 },
    {
      normal: { name: "Shred Papers", startup: 5, active: 2, recovery: 9, knockback: 6 },
      special: {
        name: "Deny Rights",
        startup: 7,
        active: 3,
        recovery: 12,
        knockback: 14,
        notes: "Freedom isn't free, it costs him a lot of money.",
      },
    }
  ),
  makeCharacter(
    "Prance",
    "RED",
    { walkSpeed: 2.7, jumpVelocity: 9, maxHP: 140 },
    {
      normal: { name: "Dad Run", startup: 4, active: 2, recovery: 10, knockback: 4 },
      special: {
        name: "Couch Toss",
        startup: 8,
        active: 5,
        recovery: 15,
        knockback: 8,
        notes: "'Tosses' a couch.",
      },
    }
  ),
  makeCharacter(
    "NormalHumanRed",
    "RED",
    { walkSpeed: 3.0, jumpVelocity: 6, maxHP: 120 },
    {
      normal: { name: "Normal Punch", startup: 6, active: 2, recovery: 10, knockback: 5 },
      special: { name: "Very Normal Move", startup: 8, active: 3, recovery: 12, knockback: 6 },
    },
    "Normal Human"
  ),
  makeCharacter(
    "Shoe",
    "BLUE",
    { walkSpeed: 4.0, jumpVelocity: 2, maxHP: 125 },
    {
      normal: { name: "Push up Glasses", startup: 4, active: 2, recovery: 10, knockback: 5 },
      special: {
        name: "Strongly Worded Letter",
        startup: 7,
        active: 4,
        recovery: 13,
        knockback: 9,
        notes: "Not much of a fighter.",
      },
    }
  ),
  makeCharacter(
    "Nandy",
    "BLUE",
    { walkSpeed: 4.5, jumpVelocity: 5, maxHP: 118 },
    {
      normal: { name: "No Explanation", startup: 4, active: 2, recovery: 9, knockback: 4 },
      special: {
        name: "Trade Stocks",
        startup: 6,
        active: 5,
        recovery: 14,
        knockback: 13,
        notes: "It's not illegal.",
      },
    }
  ),
  makeCharacter(
    "Jeppy",
    "BLUE",
    { walkSpeed: 3.9, jumpVelocity: 10, maxHP: 132 },
    {
      normal: { name: "Plan", startup: 5, active: 2, recovery: 11, knockback: 6 },
      special: {
        name: "Plan",
        startup: 8,
        active: 4,
        recovery: 15,
        knockback: 7,
        notes: "Things are very complicated.",
      },
    }
  ),
  makeCharacter(
    "Cinema",
    "BLUE",
    { walkSpeed: 3.6, jumpVelocity: 8, maxHP: 138 },
    {
      normal: { name: "Obstruct", startup: 4, active: 2, recovery: 10, knockback: 5 },
      special: {
        name: "Side With Republicans",
        startup: 9,
        active: 5,
        recovery: 16,
        knockback: 10,
        notes: "Caucuses blue.",
      },
    }
  ),
  makeCharacter(
    "NormalHumanBlue",
    "BLUE",
    { walkSpeed: 3.0, jumpVelocity: 6, maxHP: 120 },
    {
      normal: { name: "Normal Punch", startup: 6, active: 2, recovery: 10, knockback: 5 },
      special: { name: "Very Normal Move", startup: 8, active: 3, recovery: 12, knockback: 6 },
    },
    "Normal Human"
  ),
];

export const CHARACTERS: readonly CharacterDefinition[] = characterList;
export const CHARACTERS_BY_ID = new Map<CharacterId, CharacterDefinition>(
  characterList.map((c) => [c.id, c])
);
