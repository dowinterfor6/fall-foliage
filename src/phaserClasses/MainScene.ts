import Leaf from "./Leaf";
import { initialMatrix } from "./treeLeavesUtil";

const posCoeff = 20;

export const PHASER_GAME_SIZE = {
  width: 1200,
  height: 800,
};

export const PHASER_CENTERS = {
  x: PHASER_GAME_SIZE.width / 2,
  y: PHASER_GAME_SIZE.height / 2
};


class MainScene extends Phaser.Scene {
  leafMatrix: Array<Array<Leaf | null>> = [];
  // selectedLeaves: Array<any> = []

  constructor() {
    super();
  }

  preload() {
    this.load.image('trunk', '/trunk.png');
    this.load.image('ground', '/ground.png');
    this.load.image('background', '/background.png');
    this.load.image('leaf', '/leafRoundSmol.png');
  }

  create() {
    this.add.image(PHASER_CENTERS.x, PHASER_CENTERS.y, 'background');
    const ground = this.physics.add.staticImage(PHASER_CENTERS.x, PHASER_CENTERS.y + 280, 'ground');
    this.add.image(PHASER_CENTERS.x, PHASER_CENTERS.y, 'trunk');

    this.leafMatrix = initialMatrix.map((row, rowIdx) => {
      return row.map((el, colIdx) => {
        if (el === 0) {
          return null;
        }

        // TODO: This is stupid and not centered but oh well
        const pos = {
          x: (colIdx - ((initialMatrix[0].length - 1) / 2)) * posCoeff + PHASER_CENTERS.x,
          y: (rowIdx - ((initialMatrix.length + 5.5) / 2)) * posCoeff + PHASER_CENTERS.y,
        };

        // const leaf = this.physics.add.sprite(pos.x, pos.y, 'leaf');
        const leaf = new Leaf(this.physics, pos, ground);
        // const tempText = this.add.text(pos.x - 10, pos.y - 10, `${colIdx}`);
        // tempText.setColor('black');

        return leaf;
      });
    });

    const getNeighborEls = (rowIdx: number, colIdx: number): Array<Leaf | null> => {
      const positions: Array<[number, number]> = [];

      for (let row = -1; row <= 1; row++) {
        for (let col = -1; col <= 1; col++) {
          positions.push([rowIdx + row, colIdx + col]);
        }
      }

      return positions.map(([rowIdx, colIdx]) => {
        if (rowIdx < 0 || rowIdx >= this.leafMatrix.length || colIdx < 0 || colIdx >= this.leafMatrix[0].length) {
          return null;
        }

        return this.leafMatrix[rowIdx][colIdx];
      });
    };

    this.leafMatrix.forEach((row, rowIdx) => {
      row.forEach((leaf, colIdx) => {
        const handlePointer = () => {
          const neighbors = getNeighborEls(rowIdx, colIdx);
          neighbors.forEach((neighbor) => {
            neighbor?.progressColor();
          });
          // leaf?.progressColor();
        };

        leaf?.setHandlePointer(handlePointer);
      });
    });

    const resetButton = this.add.circle(10, 10, 10, 0xffffff);
    resetButton.setInteractive();
    resetButton.on('pointerdown', () => {
      this.leafMatrix.forEach((row) => {
        row.forEach((leaf) => leaf?.reset());
      });
    });
  }
}

export default MainScene;