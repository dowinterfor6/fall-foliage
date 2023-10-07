export enum LEAF_COLORS {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
  BLACK = 'BLACK',
}

type Pos = {
  x: number,
  y: number;
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

  constructor(physics: Phaser.Physics.Arcade.ArcadePhysics, pos: Pos, ground: Phaser.Types.Physics.Arcade.ImageWithStaticBody) {
    this.startingPos = pos;
    this.gameObject = physics.add.sprite(pos.x, pos.y, 'leaf');
    physics.add.collider(ground, this.gameObject);
    this.gameObject.setRotation(Phaser.Math.Between(0, 2 * Math.PI));

    // TODO: Maybe I should "reset" in the constructor, oh well
    // this.pepsi = false;

    this.gameObject.setTint(0xf0fff0);

    this.gameObject.setInteractive();
  }

  setHandlePointer(handlePointer: () => void) {
    this.gameObject.on('pointerdown', handlePointer);
  }

  progressColor() {
    if (this.color === LEAF_COLORS.GREEN) {
      this.color = LEAF_COLORS.YELLOW;
      this.gameObject.setTint(0xfffff0);
    } else if (this.color === LEAF_COLORS.YELLOW) {
      this.color = LEAF_COLORS.RED;
      this.gameObject.setTint(0xfff0f0);
      this.gameObject.setGravityY(200);
    }
  }

  reset() {
    this.gameObject.setPosition(this.startingPos.x, this.startingPos.y);
    this.gameObject.setGravityY(0);
    this.gameObject.setTint(0xf0fff0);
    this.color = LEAF_COLORS.GREEN;
    // this.pepsi = false;
  }

  setPepsi() {
    // this.pepsi = true;
    this.color = LEAF_COLORS.BLACK;
    this.gameObject.setTint(0x121212);
  }
}

export default Leaf;