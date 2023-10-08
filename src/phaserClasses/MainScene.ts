import Leaf, { LEAF_COLORS } from "./Leaf";
import { getNeighborEls, initialMatrix, sleep } from "./treeLeavesUtil";

const posCoeff = 20;

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
  PROPAGATION = "PROPAGATION"
}

const PROPAGATION_WAIT_MS = 300;

const LEAF_SELECTION_PENALTY_MULTIPLIER = 2;

class MainScene extends Phaser.Scene {
  leafMatrix: Array<Array<Leaf | null>> = [];
  leavesToPropagate: Array<Leaf> = [];
  initialLeafSelection: Array<Leaf> = [];
  gamePhase: GAME_PHASE = GAME_PHASE.SELECTION;
  convertedLeaves: number = 0;

  constructor() {
    super();
    console.log("PHASE CHANGE TO: ", this.gamePhase);
    this.resetGame();
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

        const leaf = new Leaf(this.physics, pos, ground, { rowIdx, colIdx });
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
            this.initialLeafSelection.push(leaf);
            leaf.highlight(true);
          }
        };

        leaf.setHandlePointer(handlePointer2);
      });
    });

    const resetButton = this.add.circle(10, 10, 10, 0xffffff);
    resetButton.setInteractive();
    resetButton.on('pointerdown', () => {
      this.resetGame();
      this.leafMatrix.forEach((row) => {
        row.forEach((leaf) => leaf?.reset());
      });
    });

    const confirmSelections = this.add.circle(30, 10, 10, 0xffffff);
    confirmSelections.setInteractive();
    confirmSelections.on('pointerdown', async () => {
      if (this.gamePhase !== GAME_PHASE.PROPAGATION) {
        this.gamePhase = GAME_PHASE.PROPAGATION;
        console.log("PHASE CHANGE TO: ", this.gamePhase);
        await this.startPropagation();
      }
    });
  }

  resetGame() {
    this.gamePhase = GAME_PHASE.SELECTION;
    console.log("PHASE CHANGE TO: ", this.gamePhase);
    this.leavesToPropagate = [];
    this.initialLeafSelection = [];
    this.convertedLeaves = 0;
  }

  async startPropagation() {
    console.log("start Propagation");
    // let newLeavesToPropagate: Array<Leaf> = [];
    const newLeavesToPropagate: Set<Leaf> = new Set();

    this.initialLeafSelection.forEach((leaf) => {
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

    console.log("score: ", this.calculateScore());
    console.log("selections used: ", this.initialLeafSelection.length);
  }

  calculateScore() {
    return this.leafMatrix.reduce((sum, row) => sum + row.reduce((rowSum, el) => el?.color === LEAF_COLORS.RED ? rowSum + 1 : rowSum, 0), 0);
  }
}

export default MainScene;