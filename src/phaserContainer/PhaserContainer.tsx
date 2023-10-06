import Phaser, { Game } from "phaser";
import { useEffect, useRef, useState } from "react";
import MainScene from "../phaserClasses/MainScene";

const PhaserContainer: React.FC = () => {
  const phaserRoot = useRef<HTMLElement>(null);
  const [phaserGame, setPhaserGame] = useState<Game>();

  useEffect(() => {
    if (phaserRoot.current && phaserGame === undefined) {
      const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        scene: MainScene,
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 200 },
            debug: true
          }
        },
        parent: phaserRoot.current
      };

      const game = new Phaser.Game(config);
      setPhaserGame(game);
    }
  }, [phaserGame]);

  return (
    <main ref={ phaserRoot }>

    </main>
  );
};

export default PhaserContainer;