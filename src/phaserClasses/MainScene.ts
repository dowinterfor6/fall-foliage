import Leaf, { LEAF_COLORS, LEAF_COLORS_HEX } from "./Leaf";
import { getNeighborEls, initialMatrix, sleep } from "./treeLeavesUtil";

const posCoeff = 24;

export const PHASER_GAME_SIZE = {
  width: 800,
  height: 675,
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

enum BUTTON_COLORS {
  DISABLED = 0xaaaaaa,
  // TODO: I'm so disappointed there aren't these states lol
  //       TIL there's `makeButton` which has `gameobjectover` and other states
  // HOVER = 0xeee,
  // POINTER_DOWN = 0xddd
}

const BACKGROUND_COLOR = 0x3d1f1d;

const FONT_COLOR = 0x9b461f;

const TEXTS = {
  FOLIAGE_SCORE: (num?: number) => `Foliage score: ${num ?? '?'}`,
  NUM_SELECTIONS: (num?: number) => `  ${num ?? '?'} selections made `,
  // SELECTION_PENALTY: () => `  Selection penalty x${LEAF_SELECTION_PENALTY_MULTIPLIER}`,
  SELECTION_PENALTY_SCORE: (num?: number) => `    -${num ?? '?'}`,
  FINAL_SCORE: (num?: number) => `Final score: ${num ?? '?'}`
};

class MainScene extends Phaser.Scene {
  leafMatrix: Array<Array<Leaf | null>> = [];
  leavesToPropagate: Array<Leaf> = [];
  initialLeafSet: Set<Leaf> = new Set();
  gamePhase: GAME_PHASE = GAME_PHASE.SELECTION;
  convertedLeaves: number = 0;
  resetButton: Phaser.GameObjects.Image | null = null;
  confirmSelectionsButton: Phaser.GameObjects.Image | null = null;
  foliageScore: Phaser.GameObjects.Text | null = null;
  numSelections: Phaser.GameObjects.Text | null = null;
  // selectionsPenalty: Phaser.GameObjects.Text | null = null;
  selectionsPenaltyScore: Phaser.GameObjects.Text | null = null;
  finalScore: Phaser.GameObjects.Text | null = null;

  constructor() {
    super();
    this.resetGame();
  }

  preload() {
    this.load.image('leaf', './maple-leaf.png');
    this.load.image('restart-icon', './restart-icon.png');
    this.load.image('play-icon', './play-icon.png');
    this.load.image('title', './title.png');
    this.load.audioSprite('sfx', './sfx_mixdown.json', ['./sfx.ogg']);
  }

  create() {
    this.add.rectangle(PHASER_CENTERS.x, PHASER_CENTERS.y, PHASER_GAME_SIZE.width, PHASER_GAME_SIZE.height, BACKGROUND_COLOR);

    this.leafMatrix = initialMatrix.map((row, rowIdx) => {
      return row.map((el, colIdx) => {
        if (el === 0) {
          return null;
        }

        // TODO: This is stupid and not centered but oh well
        const pos = {
          x: (colIdx - ((initialMatrix[0].length) / 2)) * posCoeff + PHASER_CENTERS.x - 125,
          y: (rowIdx - ((initialMatrix.length) / 2)) * posCoeff + PHASER_CENTERS.y + 50,
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
            this.sound.playAudioSprite('sfx', 'select');
            if (this.initialLeafSet.has(leaf)) {
              this.initialLeafSet.delete(leaf);
              leaf.highlight(false);
            } else {
              this.initialLeafSet.add(leaf);
              leaf.highlight(true);
            }
            this.numSelections?.setText(TEXTS.NUM_SELECTIONS(this.initialLeafSet.size));
            this.selectionsPenaltyScore?.setText(TEXTS.SELECTION_PENALTY_SCORE(this.initialLeafSet.size * LEAF_SELECTION_PENALTY_MULTIPLIER));
          }
        };

        leaf.setHandlePointer(handlePointer2);
      });
    });

    this.resetButton = this.add.image(PHASER_CENTERS.x + 145, PHASER_CENTERS.y - 185, 'restart-icon');
    // I should probably just hide this when propagating
    this.resetButton.setInteractive();
    this.resetButton.on('pointerdown', () => {
      if (this.gamePhase !== GAME_PHASE.PROPAGATION) {
        this.sound.playAudioSprite('sfx', 'reset');
        this.resetGame();
        this.leafMatrix.forEach((row) => {
          row.forEach((leaf) => leaf?.reset());
        });
      }
    });

    this.confirmSelectionsButton = this.add.image(PHASER_CENTERS.x + 210, PHASER_CENTERS.y - 185, 'play-icon');
    this.confirmSelectionsButton.setInteractive();
    this.confirmSelectionsButton.on('pointerdown', async () => {
      if (this.gamePhase !== GAME_PHASE.PROPAGATION) {
        this.sound.playAudioSprite('sfx', 'start');
        this.gamePhase = GAME_PHASE.PROPAGATION;

        this.resetButton?.setTint(BUTTON_COLORS.DISABLED);
        this.resetButton?.setAlpha(0.6);
        await this.startPropagation();
      }
    });

    // Font credits: https://mistifonts.com/falling-for-autumn/
    this.add.image(PHASER_CENTERS.x, PHASER_CENTERS.y - 260, 'title');

    this.createTexts();
    this.createInstructionTexts();
  }

  createTexts() {
    this.foliageScore = this.add.text(PHASER_CENTERS.x + 120, PHASER_CENTERS.y - 140, TEXTS.FOLIAGE_SCORE());
    this.numSelections = this.add.text(PHASER_CENTERS.x + 120, PHASER_CENTERS.y - 115, TEXTS.NUM_SELECTIONS());
    const selectionText = this.add.text(PHASER_CENTERS.x + 120, PHASER_CENTERS.y - 90, `  Selection Penalty (x${LEAF_SELECTION_PENALTY_MULTIPLIER})`);
    this.selectionsPenaltyScore = this.add.text(PHASER_CENTERS.x + 120, PHASER_CENTERS.y - 65, TEXTS.SELECTION_PENALTY_SCORE());
    this.finalScore = this.add.text(PHASER_CENTERS.x + 120, PHASER_CENTERS.y - 40, TEXTS.FINAL_SCORE());

    [this.foliageScore, this.numSelections, selectionText, this.selectionsPenaltyScore, this.finalScore].forEach((text) => {
      text.setTint(FONT_COLOR);
      text.setAlpha(0.9);
      text.setFontStyle('bold');
    });
  }

  createInstructionTexts() {
    const instructionsStyle: Phaser.Types.GameObjects.Text.TextStyle = { fontSize: 13 };

    const text1 = this.add.text(PHASER_CENTERS.x + 120, PHASER_CENTERS.y + 5, 'Instructions: ', instructionsStyle);

    const longText = `
Pick initial leaf selections
to trigger foliage change.
Foliage will only change if
the recently changed leaf has
an even number of neighbors.
This will cause the leaf's
immediate neighbors to also
change, in this pattern: 
    `;

    const text2 = this.add.text(PHASER_CENTERS.x + 120, PHASER_CENTERS.y + 15, longText, instructionsStyle);

    // TODO: This is disgusting
    this.add.image(PHASER_CENTERS.x + 185, PHASER_CENTERS.y + 205, 'leaf').setTint(LEAF_COLORS_HEX.YELLOW).setRotation(Phaser.Math.Between(0, 2 * Math.PI));
    this.add.image(PHASER_CENTERS.x + 185 - posCoeff, PHASER_CENTERS.y + 205, 'leaf').setTint(LEAF_COLORS_HEX.GREEN).setRotation(Phaser.Math.Between(0, 2 * Math.PI));
    this.add.image(PHASER_CENTERS.x + 185 - 2 * posCoeff, PHASER_CENTERS.y + 205, 'leaf').setTint(LEAF_COLORS_HEX.YELLOW).setRotation(Phaser.Math.Between(0, 2 * Math.PI));
    this.add.image(PHASER_CENTERS.x + 185, PHASER_CENTERS.y + 205 - posCoeff, 'leaf').setTint(LEAF_COLORS_HEX.GREEN).setRotation(Phaser.Math.Between(0, 2 * Math.PI));
    this.add.image(PHASER_CENTERS.x + 185 - posCoeff, PHASER_CENTERS.y + 205 - posCoeff, 'leaf').setTint(LEAF_COLORS_HEX.HIGHLIGHT).setRotation(Phaser.Math.Between(0, 2 * Math.PI));
    this.add.image(PHASER_CENTERS.x + 185 - 2 * posCoeff, PHASER_CENTERS.y + 205 - posCoeff, 'leaf').setTint(LEAF_COLORS_HEX.GREEN).setRotation(Phaser.Math.Between(0, 2 * Math.PI));
    this.add.image(PHASER_CENTERS.x + 185, PHASER_CENTERS.y + 205 - 2 * posCoeff, 'leaf').setTint(LEAF_COLORS_HEX.YELLOW).setRotation(Phaser.Math.Between(0, 2 * Math.PI));
    this.add.image(PHASER_CENTERS.x + 185 - posCoeff, PHASER_CENTERS.y + 205 - 2 * posCoeff, 'leaf').setTint(LEAF_COLORS_HEX.GREEN).setRotation(Phaser.Math.Between(0, 2 * Math.PI));
    this.add.image(PHASER_CENTERS.x + 185 - 2 * posCoeff, PHASER_CENTERS.y + 205 - 2 * posCoeff, 'leaf').setTint(LEAF_COLORS_HEX.YELLOW).setRotation(Phaser.Math.Between(0, 2 * Math.PI));

    const longText2 = `
Leaves will change from green
to yellow to red, and will
only count for score if it
reaches red and falls off.
    `;

    const text3 = this.add.text(PHASER_CENTERS.x + 120, PHASER_CENTERS.y + 215, longText2, instructionsStyle);

    [text1, text2, text3].forEach((text) => {
      text.setAlpha(0.7);
    });
  }

  resetTexts() {
    this.foliageScore?.setText(TEXTS.FOLIAGE_SCORE());
    this.numSelections?.setText(TEXTS.NUM_SELECTIONS());
    this.selectionsPenaltyScore?.setText(TEXTS.SELECTION_PENALTY_SCORE());
    this.finalScore?.setText(TEXTS.FINAL_SCORE());
  }

  resetGame() {
    this.gamePhase = GAME_PHASE.SELECTION;
    this.leavesToPropagate = [];
    this.initialLeafSet.clear();
    this.convertedLeaves = 0;
    this.resetTexts();
  }

  async startPropagation() {
    await sleep(300);
    const newLeavesToPropagate: Set<Leaf> = new Set();

    this.initialLeafSet.forEach((leaf) => {
      leaf.highlight(false);
      this.sound.playAudioSprite('sfx', 'leaves');
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
        this.sound.playAudioSprite('sfx', 'leaves');
        leaf.progressColor();

        this.foliageScore?.setText(TEXTS.FOLIAGE_SCORE(this.calculateScore()));

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

    this.sound.playAudioSprite('sfx', 'score');
    this.finalScore?.setText(TEXTS.FINAL_SCORE(this.calculateScore() - this.initialLeafSet.size * LEAF_SELECTION_PENALTY_MULTIPLIER));
    this.resetButton?.clearTint();
    this.resetButton?.setAlpha(1);
    this.gamePhase = GAME_PHASE.SCORE;
  }

  calculateScore() {
    return this.leafMatrix.reduce((sum, row) => sum + row.reduce((rowSum, el) => el?.color === LEAF_COLORS.RED ? rowSum + 1 : rowSum, 0), 0);
  }
}

export default MainScene;