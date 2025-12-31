import { Input } from "./input";
import { CHARACTERS, CharacterDefinition } from "./game/characters";
import {
  State,
  StateName,
  TitleState,
  SelectState,
  FightState,
  ResultsState,
} from "./states";

const BASE_W = 800;
const BASE_H = 480;
const FIXED_DT = 1 / 60; // seconds
// This comment is to make a commit to try to kick off github actions
export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  input: Input;
  selectedCharacters: Record<1 | 2, CharacterDefinition> = {
    1: CHARACTERS[0],
    2: CHARACTERS[4],
  };
  lastResultMessage = "";
  private states = new Map<StateName, State>();
  private current?: State;
  private currentName?: StateName;

  // loop timing
  private lastTime = 0;
  private accumulator = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D context");
    this.ctx = ctx;
    this.canvas.width = BASE_W;
    this.canvas.height = BASE_H;

    this.input = new Input();

    // create states
    this.states.set("Title", new TitleState(this, this.input));
    this.states.set("Select", new SelectState(this, this.input));
    this.states.set("Fight", new FightState(this, this.input));
    this.states.set("Results", new ResultsState(this, this.input));

    this.setState("Title");

    this.handleResize();
    window.addEventListener("resize", () => this.handleResize());
  }

  setState(name: StateName) {
    if (this.current) this.current.exit();
    this.current = this.states.get(name)!;
    this.currentName = name;
    this.current.enter();
    // clear any buffered single-press inputs to avoid instant triggers
    this.input.reset();
  }

  private handleResize() {
    // letterbox: scale canvas via CSS while keeping internal resolution BASE_W x BASE_H
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    const scale = Math.min(sw / BASE_W, sh / BASE_H);
    const cssW = Math.floor(BASE_W * scale);
    const cssH = Math.floor(BASE_H * scale);
    this.canvas.style.width = cssW + "px";
    this.canvas.style.height = cssH + "px";
  }

  start() {
    this.lastTime = performance.now() / 1000;
    requestAnimationFrame((t) => this.frame(t));
  }

  private frame(nowMs: number) {
    const now = nowMs / 1000;
    let frameTime = now - this.lastTime;
    // avoid spiral of death
    if (frameTime > 0.25) frameTime = 0.25;
    this.lastTime = now;

    this.accumulator += frameTime;

    while (this.accumulator >= FIXED_DT) {
      this.update(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }

    // optional interpolation amount between previous and next state
    const alpha = this.accumulator / FIXED_DT;
    this.render(alpha);

    requestAnimationFrame((t) => this.frame(t));
  }

  private update(dt: number) {
    this.input.update();
    if (this.current) this.current.update(dt);
  }

  private render(interp: number) {
    if (this.current) this.current.render(this.ctx);
    // optionally, render debug FPS / state
    this.ctx.fillStyle = "#e6e6e6";
    this.ctx.font = "12px monospace";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`State: ${this.currentName}`, 8, this.canvas.height - 8);
  }

  setPlayerCharacter(player: 1 | 2, character: CharacterDefinition) {
    this.selectedCharacters[player] = character;
  }

  setResultMessage(msg: string) {
    this.lastResultMessage = msg;
  }
}
