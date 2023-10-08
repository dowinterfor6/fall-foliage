import Leaf, { LEAF_COLORS } from "./Leaf";
import { getNeighborEls, initialMatrix, sleep } from "./treeLeavesUtil";

// TODO: For some reason if this is 30 everything breaks lol
const posCoeff = 24;

export const PHASER_GAME_SIZE = {
  width: 1200,
  height: 800,
};

export const PHASER_CENTERS = {
  x: PHASER_GAME_SIZE.width / 2,
  y: PHASER_GAME_SIZE.height / 2
};

// TODO: Actually use a state machine in the future
enum GAME_PHASE {
  SELECTION = 'SELECTION',
  PROPAGATION = "PROPAGATION",
  SCORE = "SCORE"
}

const PROPAGATION_WAIT_MS = 300;

const LEAF_SELECTION_PENALTY_MULTIPLIER = 10;

class MainScene extends Phaser.Scene {
  leafMatrix: Array<Array<Leaf | null>> = [];
  leavesToPropagate: Array<Leaf> = [];
  initialLeafSet: Set<Leaf> = new Set();
  gamePhase: GAME_PHASE = GAME_PHASE.SELECTION;
  convertedLeaves: number = 0;

  constructor() {
    super();
    this.resetGame();
  }

  preload() {
    this.load.image('leaf', '/maple-leaf.png');
  }

  create() {
    // const ground = this.physics.add.staticImage(PHASER_CENTERS.x, PHASER_CENTERS.y + 280, 'ground');

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

        const leaf = new Leaf(this.physics, pos, { rowIdx, colIdx });
        // const tempText = this.add.text(pos.x - 10, pos.y - 10, `${colIdx}`);
        // tempText.setColor('black');

        return leaf;
      });
    });

    this.leafMatrix.forEach((row) => {
      row.forEach((leaf) => {
        if (leaf === null) {
          return;
        }

        const handlePointer2 = () => {
          if (this.gamePhase === GAME_PHASE.SELECTION) {
            if (this.initialLeafSet.has(leaf)) {
              this.initialLeafSet.delete(leaf);
              leaf.highlight(false);
            } else {
              this.initialLeafSet.add(leaf);
              leaf.highlight(true);
            }
          }
        };

        leaf.setHandlePointer(handlePointer2);
      });
    });

    const resetButton = this.add.circle(10, 10, 10, 0xffffff);
    // I should probably just hide this when propagating
    resetButton.setInteractive();
    resetButton.on('pointerdown', () => {
      if (this.gamePhase !== GAME_PHASE.PROPAGATION) {
        this.resetGame();
        this.leafMatrix.forEach((row) => {
          row.forEach((leaf) => leaf?.reset());
        });
      }
    });

    const confirmSelections = this.add.circle(30, 10, 10, 0xffffff);
    confirmSelections.setInteractive();
    confirmSelections.on('pointerdown', async () => {
      if (this.gamePhase !== GAME_PHASE.PROPAGATION) {
        this.gamePhase = GAME_PHASE.PROPAGATION;

        await this.startPropagation();
      }
    });
  }

  resetGame() {
    this.gamePhase = GAME_PHASE.SELECTION;
    this.leavesToPropagate = [];
    this.initialLeafSet.clear();
    this.convertedLeaves = 0;
  }

  async startPropagation() {
    const newLeavesToPropagate: Set<Leaf> = new Set();

    this.initialLeafSet.forEach((leaf) => {
      leaf.highlight(false);
      leaf.progressColor();

      const { rowIdx, colIdx } = leaf.leafMatrixPos;

      const neighborEls = getNeighborEls(this.leafMatrix, rowIdx, colIdx);
      const nonNullNeighbors = neighborEls.filter<Leaf>((el): el is Leaf => el instanceof Leaf);

      if (nonNullNeighbors.length % 2 === 0) {
        // Even propagates edges
        const edges = [[rowIdx - 1, colIdx + 1], [rowIdx - 1, colIdx - 1], [rowIdx + 1, colIdx + 1], [rowIdx + 1, colIdx - 1]];

        edges.forEach(([rowIdx, colIdx]) => {
          const foundLeaf = nonNullNeighbors.find((leaf) => leaf.leafMatrixPos.rowIdx === rowIdx && leaf.leafMatrixPos.colIdx === colIdx);
          if (foundLeaf) {
            newLeavesToPropagate.add(foundLeaf);
          }
        });
      }
      //  else {
      //   // Odd propagates middles
      //   const middles = [[rowIdx - 1, colIdx], [rowIdx + 1, colIdx], [rowIdx, colIdx + 1], [rowIdx, colIdx - 1]];

      //   middles.forEach(([rowIdx, colIdx]) => {
      //     const foundLeaf = nonNullNeighbors.find((leaf) => leaf.leafMatrixPos.rowIdx === rowIdx && leaf.leafMatrixPos.colIdx === colIdx);
      //     if (foundLeaf) {
      //       newLeavesToPropagate.add(foundLeaf);
      //     }
      //   });
      // }
    });

    while (newLeavesToPropagate.size > 0) {
      const copyNewLeaves = new Set(newLeavesToPropagate);
      newLeavesToPropagate.clear();

      copyNewLeaves.forEach((leaf) => {
        leaf.progressColor();

        if (leaf.color !== LEAF_COLORS.RED) {
          // TODO: This is terrible since I just copied from above but oh well
          const { rowIdx, colIdx } = leaf.leafMatrixPos;

          const neighborEls = getNeighborEls(this.leafMatrix, rowIdx, colIdx);
          const nonNullNeighbors = neighborEls.filter<Leaf>((el): el is Leaf => el instanceof Leaf);

          if (nonNullNeighbors.length % 2 === 0) {
            // Even propagates edges
            const edges = [[rowIdx - 1, colIdx + 1], [rowIdx - 1, colIdx - 1], [rowIdx + 1, colIdx + 1], [rowIdx + 1, colIdx - 1]];

            edges.forEach(([rowIdx, colIdx]) => {
              const foundLeaf = nonNullNeighbors.find((leaf) => leaf.leafMatrixPos.rowIdx === rowIdx && leaf.leafMatrixPos.colIdx === colIdx);
              if (foundLeaf) {
                newLeavesToPropagate.add(foundLeaf);
              }
            });
          }
          //  else {
          //   // Odd propagates middles
          //   const middles = [[rowIdx - 1, colIdx], [rowIdx + 1, colIdx], [rowIdx, colIdx + 1], [rowIdx, colIdx - 1]];

          //   middles.forEach(([rowIdx, colIdx]) => {
          //     const foundLeaf = nonNullNeighbors.find((leaf) => leaf.leafMatrixPos.rowIdx === rowIdx && leaf.leafMatrixPos.colIdx === colIdx);
          //     if (foundLeaf) {
          //       newLeavesToPropagate.add(foundLeaf);
          //     }
          //   });
          // }
        }
      });

      await sleep(PROPAGATION_WAIT_MS);
    }

    await sleep(2500);

    this.gamePhase = GAME_PHASE.SCORE;
    console.log("score: ", this.calculateScore());
    console.log("selections used: ", this.initialLeafSet.size);
    console.log("selections penalty: ", this.initialLeafSet.size * LEAF_SELECTION_PENALTY_MULTIPLIER);
  }

  calculateScore() {
    return this.leafMatrix.reduce((sum, row) => sum + row.reduce((rowSum, el) => el?.color === LEAF_COLORS.RED ? rowSum + 1 : rowSum, 0), 0);
  }
}

export default MainScene;