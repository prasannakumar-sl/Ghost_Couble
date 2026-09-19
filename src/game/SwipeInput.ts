import { GestureResponderEvent, PanResponderGestureState } from 'react-native';

export type InputCommand = 'LEFT' | 'RIGHT' | 'JUMP' | 'SLIDE';

interface Point {
  x: number;
  y: number;
}

export class SwipeInput {
  private readonly threshold: number;
  private start: Point | null = null;
  private consumed = false;

  constructor(threshold = 42) {
    this.threshold = threshold;
  }

  onGrant(event: GestureResponderEvent) {
    this.start = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
    this.consumed = false;
  }

  onMove(_event: GestureResponderEvent, _gesture: PanResponderGestureState) {}

  onRelease(event: GestureResponderEvent): InputCommand | null {
    if (!this.start || this.consumed) return null;
    const dx = event.nativeEvent.pageX - this.start.x;
    const dy = event.nativeEvent.pageY - this.start.y;
    this.start = null;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < this.threshold) return null;
    this.consumed = true;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'RIGHT' : 'LEFT';
    return dy > 0 ? 'SLIDE' : 'JUMP';
  }
}
