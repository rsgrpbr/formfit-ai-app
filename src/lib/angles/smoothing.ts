/** Moving-average buffer for smoothing joint angles across frames */
export class AngleBuffer {
  private buffers: Map<string, number[]> = new Map();
  private windowSize = 5;

  smooth(key: string, value: number): number {
    if (!this.buffers.has(key)) this.buffers.set(key, []);
    const buf = this.buffers.get(key)!;
    buf.push(value);
    if (buf.length > this.windowSize) buf.shift();
    return buf.reduce((a, b) => a + b) / buf.length;
  }

  reset() {
    this.buffers.clear();
  }
}
