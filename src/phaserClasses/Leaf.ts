enum LEAF_COLORS {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED'
}

type Pos = {
  x: number,
  y: number;
};

type Size = {
  width: number;
  height: number;
};

class Leaf {
  isVisible = true;
  isGravityAffected = false;
  neighbors: Array<Leaf> = [];
  color: LEAF_COLORS = LEAF_COLORS.GREEN;
  isHighlighted = false;
  gameObject: Phaser.GameObjects.GameObject;

  constructor(scene: Phaser.Scene, pos: Pos, size: Size, fillColor: number = 0xeeeeee, fillAlpha: number = 0xffffff) {
    this.gameObject = new Phaser.GameObjects.Rectangle(scene, pos.x, pos.y, size.width, size.height, fillColor, fillAlpha);
  }
}

export default Leaf;