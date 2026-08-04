export type LaneId = 'headline' | 'media' | 'underground';

export const LANES: readonly LaneId[] = ['headline', 'media', 'underground'];

export const LANE_LABELS: Record<LaneId, string> = {
  headline: 'The Headline',
  media: 'The Media',
  underground: 'The Underground',
};

export type CardType = 'scandal' | 'satire' | 'leak' | 'spin' | 'fabrication';

export interface Card {
  id: string;
  name: string;
  lane: LaneId;
  type: CardType;
  /** Base power when deployed to its lane. */
  power: number;
  /** Fuel gained when the card is fed to the shredder. */
  fuel: number;
  /** 0..100 — how violently this card's value swings with the meta. */
  volatility: number;
}

export interface PlayerState {
  id: string;
  hand: Card[];
  fuel: number;
  elo: number;
}
