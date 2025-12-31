import { Input, PlayerId } from "./input";
import { Game } from "./game";
import { CHARACTERS, CharacterDefinition } from "./game/characters";

export type StateName = "Title" | "Select" | "Fight" | "Results";

export interface State {
  enter(): void;
  exit(): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}

type PlayerSelect = { index: number; locked: boolean };

type Fighter = {
  id: PlayerId;
  character: CharacterDefinition;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  onGround: boolean;
  facing: 1 | -1;
  color: string;
  flashTimer: number;
  hitTimer: number;
  lastAction: string;
  lastActionTimer: number;
};

const imageCache = new Map<string, HTMLImageElement>();
const getImage = (path: string) => {
  const withBase = (p: string) =>
    `${import.meta.env.BASE_URL}${p.startsWith("/") ? p.slice(1) : p}`;
  const key = path;
  let img = imageCache.get(key);
  if (!img) {
    img = new Image();
    img.src = withBase(path);
    imageCache.set(key, img);
  }
  return img;
};

const wrapIndex = (idx: number, length: number) => {
  const mod = ((idx % length) + length) % length;
  return mod;
};

export class TitleState implements State {
  constructor(private game: Game, private input: Input) {}
  enter() {}
  exit() {}
  update(dt: number) {
    if (this.input.pressedAny("confirm")) {
      this.game.setState("Select");
    }
  }
  render(ctx: CanvasRenderingContext2D) {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#e6e6e6";
    ctx.textAlign = "center";
    ctx.font = "48px sans-serif";
    ctx.fillText("Political Fight", width / 2, height / 2 - 20);
    ctx.font = "20px sans-serif";
    ctx.fillText("Press Enter / Right Shift to Start", width / 2, height / 2 + 30);
  }
}

export class SelectState implements State {
  private selections: Record<PlayerId, PlayerSelect> = {
    1: { index: 0, locked: false },
    2: { index: 4, locked: false },
  };
  private warningText = "";
  private warningTimer = 0;
  private blockedIds = new Set(["Cinema", "NormalHumanRed", "NormalHumanBlue"]);

  constructor(private game: Game, private input: Input) {}

  enter() {
    // align indices with previously chosen characters
    for (const player of [1, 2] as const) {
      const id = this.game.selectedCharacters[player].id;
      const idx = CHARACTERS.findIndex((c) => c.id === id);
      this.selections[player].index = idx >= 0 ? idx : this.selections[player].index;
      this.selections[player].locked = false;
    }
  }
  exit() {}

  private move(player: PlayerId, delta: number) {
    const state = this.selections[player];
    if (state.locked) return;
    state.index = wrapIndex(state.index + delta, CHARACTERS.length);
  }

  private toggleLock(player: PlayerId) {
    const state = this.selections[player];
    state.locked = !state.locked;
    if (state.locked) {
      this.game.setPlayerCharacter(player, CHARACTERS[state.index]);
    }
  }

  update(dt: number) {
    this.warningTimer = Math.max(0, this.warningTimer - dt);

    for (const player of [1, 2] as const) {
      if (this.input.pressed(player, "left")) this.move(player, -1);
      if (this.input.pressed(player, "right")) this.move(player, 1);
      if (this.input.pressed(player, "jump")) this.move(player, -5); // jump up a row
      if (this.input.pressed(player, "special")) this.move(player, 5); // drop down a row
      if (this.input.pressed(player, "confirm")) {
        const chosen = CHARACTERS[this.selections[player].index];
        if (this.blockedIds.has(chosen.id)) {
          this.warningText =
            chosen.id === "Cinema" ? "Oops, wrong team" : "Vote to Unlock";
          this.warningTimer = 2.0;
          continue;
        }
        this.toggleLock(player);
      }
    }

    if (this.selections[1].locked && this.selections[2].locked) {
      this.game.setState("Fight");
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0c0d14";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#e6e6e6";
    ctx.textAlign = "center";
    ctx.font = "32px sans-serif";
    ctx.fillText("Character Select", width / 2, 40);
    ctx.font = "16px sans-serif";
    ctx.fillText(
      "P1: A/D to move, W up a row, L special down, Enter lock | P2: Arrows / Up / Comma, Right Shift lock",
      width / 2,
      65
    );

    const cardW = 140;
    const cardH = 140;
    const gap = 12;
    const cols = 5;
    const startX = (width - (cols * cardW + (cols - 1) * gap)) / 2;
    const startY = 70;

    CHARACTERS.forEach((character, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = startX + col * (cardW + gap);
      const y = startY + row * (cardH + gap);

      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = character.team === "RED" ? "#5a1a1a" : "#162a60";
      ctx.fillRect(0, 0, cardW, cardH);
      ctx.strokeStyle = "#303040";
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, cardW, cardH);

      const img = getImage(character.portraitPath);
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 10, 10, cardW - 20, cardH - 60);
      } else {
        ctx.fillStyle = "#222";
        ctx.fillRect(10, 10, cardW - 20, cardH - 60);
      }

      ctx.fillStyle = "#f0f0f0";
      ctx.font = "16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(character.displayName, 12, cardH - 22);

      const p1Here = this.selections[1].index === idx;
      const p2Here = this.selections[2].index === idx;
      if (p1Here || p2Here) {
        ctx.lineWidth = 5;
        if (p1Here) {
          ctx.strokeStyle = this.selections[1].locked ? "#7ef2ff" : "#5fd0ff";
          ctx.strokeRect(3, 3, cardW - 6, cardH - 6);
        }
        if (p2Here) {
          ctx.strokeStyle = this.selections[2].locked ? "#ffe479" : "#ffc857";
          ctx.strokeRect(8, 8, cardW - 16, cardH - 16);
        }
      }

      const baseY = cardH - 12;
      if (p1Here) {
        ctx.fillStyle = this.selections[1].locked ? "#7ef2ff" : "#5fd0ff";
        ctx.font = "14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(this.selections[1].locked ? "P1 LOCKED" : "P1", cardW / 2 - 4, baseY);
      }
      if (p2Here) {
        ctx.fillStyle = this.selections[2].locked ? "#ffe479" : "#ffc857";
        ctx.font = "14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(this.selections[2].locked ? "P2 LOCKED" : "P2", cardW / 2 + 36, baseY);
      }
      ctx.restore();
    });

    ctx.font = "18px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#8bd3ff";
    const p1Char = CHARACTERS[this.selections[1].index];
    const p2Char = CHARACTERS[this.selections[2].index];
    ctx.fillText(`P1 -> ${p1Char.displayName}`, width / 2 - 115, height - 70);
    ctx.fillStyle = "#ffde85";
    ctx.fillText(`P2 -> ${p2Char.displayName}`, width / 2 + 145, height - 70);

    if (this.warningTimer > 0) {
      ctx.fillStyle = "#ff6b6b";
      ctx.font = "20px monospace";
      ctx.textAlign = "center";
      ctx.fillText(this.warningText, width / 2, height - 80);
    }
  }
}

export class FightState implements State {
  private fighters: Fighter[] = [];
  private gravity = 1100;
  private moveScale = 30;
  private jumpScale = 70;
  private audienceMax = 100;
  private audience = this.audienceMax;
  private audienceSprites = [
    "/audience/person1.svg",
    "/audience/person2.svg",
    "/audience/person3.svg",
  ];
  private audienceSeats: boolean[] = [];

  constructor(private game: Game, private input: Input) {}

  enter() {
    this.game.setResultMessage("");
    this.resetAudience();
    const p1 = this.makeFighter(1, this.game.selectedCharacters[1], 140);
    const p2 = this.makeFighter(2, this.game.selectedCharacters[2], 520);
    this.fighters = [p1, p2];
  }
  exit() {}

  private makeFighter(id: PlayerId, character: CharacterDefinition, x: number): Fighter {
    return {
      id,
      character,
      x,
      y: 200,
      w: 70,
      h: 100,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: id === 1 ? 1 : -1,
      color: character.team === "RED" ? "#ff8a8a" : "#86b6ff",
      flashTimer: 0,
      hitTimer: 0,
      lastAction: "",
      lastActionTimer: 0,
    };
  }

  private other(f: Fighter) {
    return this.fighters.find((x) => x !== f)!;
  }

  private resetAudience() {
    this.audienceSeats = Array(this.audienceMax).fill(true);
    this.audience = this.audienceMax;
  }

  private removeAudience(count: number) {
    const occupied = this.audienceSeats
      .map((filled, idx) => ({ filled, idx }))
      .filter((s) => s.filled)
      .map((s) => s.idx);

    const toRemove = Math.min(count, occupied.length);
    for (let i = 0; i < toRemove; i++) {
      const pickIdx = Math.floor(Math.random() * occupied.length);
      const seatIndex = occupied[pickIdx];
      this.audienceSeats[seatIndex] = false;
      occupied.splice(pickIdx, 1);
    }
    this.audience = this.audienceSeats.filter(Boolean).length;
  }

  private tryAttack(f: Fighter, action: "normal" | "special") {
    if (!this.input.pressed(f.id, action)) return;
    const move = f.character.moves[action];
    f.lastAction = `${action.toUpperCase()}: ${move.name}`;
    f.lastActionTimer = 1.0;
    f.flashTimer = 0.2;

    const target = this.other(f);
    const reachX = 90;
    const reachY = 70;
    const centerX = f.x + f.w / 2;
    const centerY = f.y + f.h / 2;
    const tCenterX = target.x + target.w / 2;
    const tCenterY = target.y + target.h / 2;
    const closeEnough =
      Math.abs(centerX - tCenterX) < reachX && Math.abs(centerY - tCenterY) < reachY;
    if (closeEnough) {
      target.hitTimer = 0.25;
      const loss = Math.floor(Math.random() * 5) + 3;
      this.removeAudience(loss);
      if (this.audience === 0) {
        this.game.setResultMessage("Everyone loses");
        this.game.setState("Results");
      }
    }
  }

  update(dt: number) {
    const ground = this.game.canvas.height - 70;

    for (const fighter of this.fighters) {
      const speed = fighter.character.stats.walkSpeed * this.moveScale;
      const jumpImpulse = fighter.character.stats.jumpVelocity * this.jumpScale;

      fighter.vx = 0;
      if (this.input.held(fighter.id, "left")) {
        fighter.vx -= speed;
        fighter.facing = -1;
      }
      if (this.input.held(fighter.id, "right")) {
        fighter.vx += speed;
        fighter.facing = 1;
      }

      if (this.input.pressed(fighter.id, "jump") && fighter.onGround) {
        fighter.vy = -jumpImpulse;
        fighter.onGround = false;
      }

      fighter.vy += this.gravity * dt;
      fighter.x += fighter.vx * dt;
      fighter.y += fighter.vy * dt;

      if (fighter.y + fighter.h >= ground) {
        fighter.y = ground - fighter.h;
        fighter.vy = 0;
        fighter.onGround = true;
      } else {
        fighter.onGround = false;
      }

      fighter.x = Math.max(20, Math.min(this.game.canvas.width - fighter.w - 20, fighter.x));
      fighter.lastActionTimer = Math.max(0, fighter.lastActionTimer - dt);
      fighter.flashTimer = Math.max(0, fighter.flashTimer - dt);
      fighter.hitTimer = Math.max(0, fighter.hitTimer - dt);
    }

    for (const fighter of this.fighters) {
      this.tryAttack(fighter, "normal");
      this.tryAttack(fighter, "special");
    }

    if (this.input.pressedAny("confirm")) {
      this.game.setResultMessage("Match ended early");
      this.game.setState("Results");
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0d0f16";
    ctx.fillRect(0, 0, width, height);

    // bleachers backdrop
    const bleacherHeight = 190;
    ctx.fillStyle = "#121828";
    ctx.fillRect(0, 0, width, bleacherHeight);

    // crowd seats
    const rows = 8;
    const cols = 12;
    const seatW = 18;
    const seatH = 20;
    const gap = 2;
    const totalW = cols * seatW + (cols - 1) * gap;
    const totalH = rows * seatH + (rows - 1) * gap;
    const startX = (width - totalW) / 2;
    const startY = 8;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const x = startX + c * (seatW + gap);
        const y = startY + r * (seatH + gap);
        const filled = this.audienceSeats[idx] ?? false;
        if (filled) {
          const sprite =
            this.audienceSprites[(r * 7 + c * 3 + idx) % this.audienceSprites.length];
          const img = getImage(sprite);
          if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, x, y, seatW, seatH);
          } else {
            ctx.fillStyle = "#7ef2ff";
            ctx.fillRect(x, y, seatW, seatH);
          }
        } else {
          ctx.fillStyle = "#1b2236";
          ctx.fillRect(x, y + seatH - 8, seatW, 8);
        }
      }
    }

    ctx.fillStyle = "#1b2133";
    ctx.fillRect(0, height - 60, width, 60);

    for (const fighter of this.fighters) {
      const img = getImage(fighter.character.spritePath);
      if (img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.translate(fighter.x + fighter.w / 2, fighter.y);
        ctx.scale(fighter.facing, 1);
        ctx.drawImage(img, -fighter.w / 2, 0, fighter.w, fighter.h);
        ctx.restore();
      } else {
        ctx.fillStyle = fighter.color;
        ctx.fillRect(fighter.x, fighter.y, fighter.w, fighter.h);
      }

      if (fighter.flashTimer > 0) {
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillRect(fighter.x, fighter.y, fighter.w, fighter.h);
      }
      if (fighter.hitTimer > 0) {
        ctx.fillStyle = "rgba(255,80,80,0.3)";
        ctx.fillRect(fighter.x - 5, fighter.y - 5, fighter.w + 10, fighter.h + 10);
      }

      if (fighter.lastActionTimer > 0) {
        ctx.fillStyle = "#e6e6e6";
        ctx.font = "14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(fighter.lastAction, fighter.x + fighter.w / 2, fighter.y - 10);
      }
    }

    ctx.fillStyle = "#cccccc";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "Move: A/D or Left/Right   Jump: W / Up   Normal: J / N   Special: L / ,   Shift/Enter to exit",
      width / 2,
      height - 24
    );
  }
}

export class ResultsState implements State {
  constructor(private game: Game, private input: Input) {}
  enter() {}
  exit() {}
  update(dt: number) {
    if (this.input.pressedAny("confirm")) {
      this.game.setState("Title");
    }
  }
  render(ctx: CanvasRenderingContext2D) {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#10121b";
    ctx.fillRect(0, 0, width, height);
    ctx.textAlign = "center";

    ctx.fillStyle = "#e6e6e6";
    ctx.font = "36px sans-serif";
    ctx.fillText("Results", width / 2, height / 2 - 60);

    const message = this.game.lastResultMessage || "Thanks for playing!";
    if (message === "Everyone loses") {
      ctx.fillStyle = "#ff4f4f";
      ctx.font = "48px sans-serif";
      ctx.fillText(message, width / 2, height / 2);
    } else {
      ctx.fillStyle = "#e6e6e6";
      ctx.font = "20px sans-serif";
      ctx.fillText(message, width / 2, height / 2);
    }

    ctx.fillStyle = "#e6e6e6";
    ctx.font = "18px sans-serif";
    ctx.fillText("Press Enter / Right Shift to return to Title", width / 2, height / 2 + 50);
  }
}
