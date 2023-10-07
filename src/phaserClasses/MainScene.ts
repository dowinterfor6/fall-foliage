import Leaf, { LEAF_COLORS } from "./Leaf";
import { initialMatrix } from "./treeLeavesUtil";

const posCoeff = 20;
const NUM_LEAVES_TO_CHANGE = 3;

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
          if (!(row === 0 && col === 0)) {
            positions.push([rowIdx + row, colIdx + col]);
          }
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
        if (leaf === null) {
          return;
        }

        const handlePointer = () => {
          const neighbors = getNeighborEls(rowIdx, colIdx);
          const nonNullNeighbors = neighbors.filter<Leaf>((e): e is Leaf => e instanceof Leaf);
          const availableNeighbors = nonNullNeighbors.filter((e) => ![LEAF_COLORS.BLACK, LEAF_COLORS.RED].includes(e.color));

          if (availableNeighbors.length < NUM_LEAVES_TO_CHANGE) {
            if (leaf.color !== LEAF_COLORS.BLACK) {
              leaf.setPepsi();
            }
          } else {
            // Rand num without replace
            const getRandomIndicesFromRange = (lim: number) => {
              const arr = [];
              for (let i = 0; i < lim; i++) {
                arr.push(i);
              }

              // Schwartzian transform
              // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
              const shuffledArr = arr.map((val) => ({ val, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map(({ val }) => val);

              return shuffledArr.slice(0, NUM_LEAVES_TO_CHANGE);
            };

            const randomIndices = getRandomIndicesFromRange(availableNeighbors.length);

            availableNeighbors.forEach((neighbor, idx) => {
              if (randomIndices.includes(idx)) {
                neighbor.progressColor();
              }
            });

            // TODO: Check the ENTIRE matrix to see what needs updating

            let needsToUpdate = true;

            while (needsToUpdate) {
              needsToUpdate = false;

              outerLoop:
              for (let rowIdx = 0; rowIdx < this.leafMatrix.length; rowIdx++) {
                for (let colIdx = 0; colIdx < this.leafMatrix.length; colIdx++) {
                  const currEl = this.leafMatrix[rowIdx][colIdx];
                  if (!(currEl instanceof Leaf)) { continue; }
                  const neighbors = getNeighborEls(rowIdx, colIdx);
                  const nonNullNeighbors = neighbors.filter<Leaf>((e): e is Leaf => e instanceof Leaf);
                  // TODO: Maybe add a function in Leaf to check if it's not black/red
                  const availableNeighbors = nonNullNeighbors.filter((e) => ![LEAF_COLORS.BLACK, LEAF_COLORS.RED].includes(e.color));
                  if (availableNeighbors.length < NUM_LEAVES_TO_CHANGE && ![LEAF_COLORS.BLACK, LEAF_COLORS.RED].includes(currEl.color)) {
                    currEl.setPepsi();
                    needsToUpdate = true;
                    break outerLoop;
                  }
                }
              }
            }
          }
        };

        leaf.setHandlePointer(handlePointer);
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