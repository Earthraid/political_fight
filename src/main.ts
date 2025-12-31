import { Game } from "./game";

const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
if (!canvas) {
  throw new Error("No canvas element found with id 'game-canvas'");
}

const game = new Game(canvas);
game.start();
