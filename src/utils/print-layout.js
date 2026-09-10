import { CARD_HEIGHT, CARD_WIDTH } from './constants';

export const PRINT_PADDING = 48;
export const PRINT_CONNECTION_PADDING = 120;

export const getPrintableBounds = (people) => {
  const peopleList = Object.values(people).filter(
    (person) => Number.isFinite(person.x) && Number.isFinite(person.y)
  );

  if (peopleList.length === 0) {
    return {
      left: 0,
      top: 0,
      width: CARD_WIDTH + PRINT_PADDING * 2,
      height: CARD_HEIGHT + PRINT_PADDING * 2,
    };
  }

  const left = Math.min(...peopleList.map((person) => person.x));
  const top = Math.min(...peopleList.map((person) => person.y));
  const right = Math.max(...peopleList.map((person) => person.x + CARD_WIDTH));
  const bottom = Math.max(...peopleList.map((person) => person.y + CARD_HEIGHT));
  const padding = PRINT_PADDING + PRINT_CONNECTION_PADDING;

  return {
    left: left - padding,
    top: top - padding,
    width: right - left + padding * 2,
    height: bottom - top + padding * 2,
  };
};

export const getPrintableOffset = (bounds) => ({
  x: -bounds.left,
  y: -bounds.top,
});
