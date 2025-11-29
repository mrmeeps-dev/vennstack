import { Zone } from './game';

export interface CardDragData {
  type: 'card';
  cardId: string;
  sourceZone: Zone | 'word-pool';
}

export interface ZoneDropData {
  type: 'zone';
  zone: Zone | 'word-pool';
}




