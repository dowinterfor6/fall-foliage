import Leaf from "./Leaf";
import { initialMatrix } from "./treeLeavesUtil";

const posCoeff = 40;

class MainScene extends Phaser.Scene {
  leafMatrix: Array<Array<Leaf | null>> = [];

  constructor() {
    super();

    // this.physics.add.body()
  }

  preload() {

  }

  create() {
    this.leafMatrix = initialMatrix.map((row, rowIdx) => {
      return row.map((el, colIdx) => {
        if (el === 0) {
          return null;
        }

        const pos = {
          x: colIdx * posCoeff,
          y: rowIdx * posCoeff,
        };

        const size = {
          width: 60,
          height: 60,
        };

        // const leaf = this.physics.add.staticBody(pos.x, pos.y)
        const leaf = new Leaf(this, pos, size);

        const leafGroup = this.physics.add.staticGroup(leaf.gameObject);
        leafGroup.children.entries.forEach((entry) => { entry.setInteractive(); entry.on('pointerdown', () => console.log("clicked")); });

        return leaf;
        // return new Leaf(this, pos, size);
      });
    });
  }
}

export default MainScene;