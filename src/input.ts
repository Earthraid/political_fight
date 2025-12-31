export type PlayerId = 1 | 2;
export type PlayerAction =
  | "left"
  | "right"
  | "jump"
  | "normal"
  | "special"
  | "confirm";

type KeyBinding = { player: PlayerId; action: PlayerAction };

type ActionState = {
  held: Set<PlayerAction>;
  pressed: Set<PlayerAction>;
  buffer: Map<PlayerAction, number>;
};

const BUFFER_FRAMES = 6;
const BUFFERABLE_ACTIONS: PlayerAction[] = ["normal", "special", "confirm"];

export class Input {
  private keyDown = new Set<string>();
  private keyPressed = new Set<string>();
  private keyMap = new Map<string, KeyBinding>();
  private players: Record<PlayerId, ActionState> = {
    1: { held: new Set(), pressed: new Set(), buffer: new Map() },
    2: { held: new Set(), pressed: new Set(), buffer: new Map() },
  };

  constructor() {
    this.installDefaultBindings();
    window.addEventListener("keydown", (e) => this.handleKeyDown(e));
    window.addEventListener("keyup", (e) => this.handleKeyUp(e));
  }

  private installDefaultBindings() {
    const bindings: Array<[string, KeyBinding]> = [
      ["a", { player: 1, action: "left" }],
      ["d", { player: 1, action: "right" }],
      ["w", { player: 1, action: "jump" }],
      ["j", { player: 1, action: "normal" }],
      ["l", { player: 1, action: "special" }],
      ["Enter", { player: 1, action: "confirm" }],
      ["ArrowLeft", { player: 2, action: "left" }],
      ["ArrowRight", { player: 2, action: "right" }],
      ["ArrowUp", { player: 2, action: "jump" }],
      ["n", { player: 2, action: "normal" }],
      [",", { player: 2, action: "special" }],
      ["ShiftRight", { player: 2, action: "confirm" }],
    ];

    for (const [key, binding] of bindings) {
      this.keyMap.set(key, binding);
    }
  }

  private normalizeKey(e: KeyboardEvent) {
    if (e.code === "ShiftRight") return "ShiftRight";
    return e.key.length === 1 ? e.key.toLowerCase() : e.key;
  }

  private handleKeyDown(e: KeyboardEvent) {
    const key = this.normalizeKey(e);
    if (!this.keyDown.has(key)) {
      this.keyPressed.add(key);
    }
    this.keyDown.add(key);
  }

  private handleKeyUp(e: KeyboardEvent) {
    const key = this.normalizeKey(e);
    this.keyDown.delete(key);
  }

  // Should be called once per fixed update step.
  update() {
    for (const player of [1, 2] as const) {
      const state = this.players[player];
      state.pressed.clear();
      state.held.clear();

      for (const action of BUFFERABLE_ACTIONS) {
        const remaining = state.buffer.get(action) ?? 0;
        if (remaining > 0) {
          state.buffer.set(action, remaining - 1);
        }
      }
    }

    for (const key of this.keyDown) {
      const binding = this.keyMap.get(key);
      if (!binding) continue;
      this.players[binding.player].held.add(binding.action);
    }

    for (const key of this.keyPressed) {
      const binding = this.keyMap.get(key);
      if (!binding) continue;
      const state = this.players[binding.player];
      state.pressed.add(binding.action);
      if (BUFFERABLE_ACTIONS.includes(binding.action)) {
        state.buffer.set(binding.action, BUFFER_FRAMES);
      }
    }

    this.keyPressed.clear();
  }

  held(player: PlayerId, action: PlayerAction) {
    return this.players[player].held.has(action);
  }

  pressed(player: PlayerId, action: PlayerAction) {
    return this.players[player].pressed.has(action);
  }

  buffered(player: PlayerId, action: PlayerAction) {
    const remaining = this.players[player].buffer.get(action) ?? 0;
    return remaining > 0;
  }

  consumeBuffered(player: PlayerId, action: PlayerAction) {
    if (this.buffered(player, action)) {
      this.players[player].buffer.set(action, 0);
      return true;
    }
    return false;
  }

  pressedAny(action: PlayerAction) {
    return this.pressed(1, action) || this.pressed(2, action);
  }

  bufferedAny(action: PlayerAction) {
    return this.buffered(1, action) || this.buffered(2, action);
  }

  reset() {
    this.keyDown.clear();
    this.keyPressed.clear();
    for (const player of [1, 2] as const) {
      this.players[player].held.clear();
      this.players[player].pressed.clear();
      this.players[player].buffer.clear();
    }
  }
}
