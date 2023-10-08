export enum LEAF_COLORS {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
  // BLACK = 'BLACK',
}

export enum LEAF_COLORS_HEX {
  GREEN = 0xb0b362,
  YELLOW = 0xe2b16c,
  RED = 0xcf5a62,
  HIGHLIGHT = 0xddddff
}

type Pos = {
  x: number,
  y: number;
};

type LeafMatrixPos = {
  rowIdx: number,
  colIdx: number;
};

class Leaf {
  // isVisible = true;
  // isGravityAffected = false;
  // neighbors: Array<Leaf> = [];
  color: LEAF_COLORS = LEAF_COLORS.GREEN;
  // isHighlighted = false;
  gameObject: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  startingPos: Pos;
  // pepsi: boolean;
  leafMatrixPos: LeafMatrixPos;

  constructor(physics: Phaser.Physics.Arcade.ArcadePhysics, pos: Pos, matrixPos: LeafMatrixPos, ground?: Phaser.Types.Physics.Arcade.ImageWithStaticBody) {
    this.startingPos = pos;
    this.gameObject = physics.add.sprite(pos.x, pos.y, 'leaf');
    // TODO: Unused, but keeping it here in case I change my mind
    if (ground) {
      physics.add.collider(ground, this.gameObject);
    }
    this.gameObject.setRotation(Phaser.Math.Between(0, 2 * Math.PI));

    this.leafMatrixPos = matrixPos;
    // TODO: Maybe I should "reset" in the constructor, oh well
    // this.pepsi = false;

    this.gameObject.setTint(LEAF_COLORS_HEX.GREEN);

    this.gameObject.setInteractive();
  }

  setHandlePointer(handlePointer: () => void) {
    this.gameObject.on('pointerdown', handlePointer);
  }

  progressColor() {
    if (this.color === LEAF_COLORS.GREEN) {
      this.color = LEAF_COLORS.YELLOW;
      this.gameObject.setTint(LEAF_COLORS_HEX.YELLOW);
    } else if (this.color === LEAF_COLORS.YELLOW) {
      this.color = LEAF_COLORS.RED;
      this.gameObject.setTint(LEAF_COLORS_HEX.RED);
      this.gameObject.setGravityY(200);
    }
  }

  reset() {
    this.gameObject.setPosition(this.startingPos.x, this.startingPos.y);
    this.gameObject.setGravityY(0);
    this.gameObject.setVelocity(0);
    this.gameObject.setTint(LEAF_COLORS_HEX.GREEN);
    this.color = LEAF_COLORS.GREEN;
    // this.pepsi = false;
  }

  // setPepsi() {
  //   // this.pepsi = true;
  //   this.color = LEAF_COLORS.BLACK;
  //   this.gameObject.setTint(0x121212);
  // }

  highlight(shouldHighlight: boolean) {
    if (shouldHighlight) {
      this.gameObject.setTint(LEAF_COLORS_HEX.HIGHLIGHT);
    } else {
      this.gameObject.setTint(LEAF_COLORS_HEX.GREEN);
    }
  }
}

export default Leaf;