import Phaser from 'phaser';

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  init(data) {
    this._results = data.results || [];
  }

  create() {
    const cx = this.scale.width / 2;
    this.add.text(cx, 60, '🏆 ROUND OVER! 🏆', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#f1c40f',
    }).setOrigin(0.5);

    this._results.forEach((r, i) => {
      const y = 140 + i * 50;
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      this.add.text(cx - 200, y, `${medal} ${r.displayName}`, {
        fontSize: '22px',
        color: '#ffffff',
      });
      this.add.text(cx + 100, y, `${r.score.toFixed(1)} pts`, {
        fontSize: '22px',
        color: '#4A90D9',
      });
      this.add.text(cx + 200, y, `${r.questionsCorrect}/${r.questionsAnswered} ✓`, {
        fontSize: '18px',
        color: '#2ecc71',
      });
    });
  }
}
