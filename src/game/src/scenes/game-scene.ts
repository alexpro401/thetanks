import { Enemy } from '../objects/enemy'
import { Bullet } from '../objects/bullet'
import { Tank } from '../objects/tank'
import { CONST } from '../const/const'
import { Drop } from '../objects/drop'

export class Game extends Phaser.Scene {
  private player: Tank
  private enemy: Enemy
  private sparkEmitter0: Phaser.GameObjects.Particles.ParticleEmitter
  private sparkEmitter1: Phaser.GameObjects.Particles.ParticleEmitter
  private drops: Drop[] = []

  constructor() {
    super({
      key: 'Game',
    })
  }

  preload(): void {}

  create(): void {
    console.log('CURRENT_TANK', CONST.CURRENT_TANK.tankCode)

    this.player = new Tank({
      scene: this,
      x: this.sys.canvas.width / 2,
      y: this.sys.canvas.height / 2,
      tankCode: CONST.CURRENT_TANK.tankCode,
    })

    this.spawnEnemy()

    this.add.tileSprite(
      this.sys.canvas.width / 2,
      this.sys.canvas.height / 2,
      this.sys.canvas.width,
      this.sys.canvas.height,
      'background',
    )

    // Sparks
    this.sparkEmitter0 = this.add.particles('spark0').createEmitter({
      x: 400,
      y: 300,
      speed: { min: -800, max: 800 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      blendMode: 'SCREEN',
      active: false,
      lifespan: 600,
      gravityY: 800,
    })

    this.sparkEmitter1 = this.add.particles('spark1').createEmitter({
      x: 400,
      y: 300,
      speed: { min: -800, max: 800 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.3, end: 0 },
      blendMode: 'SCREEN',
      active: false,
      lifespan: 300,
      gravityY: 800,
    })

    let buttonInventory = this.add.image(250, this.sys.canvas.height - 100, 'buttonInventory')
    buttonInventory.setInteractive({ cursor: 'pointer' })
    buttonInventory.on('pointerover', () => buttonInventory.setTint(0x9887ff))
    buttonInventory.on('pointerout', () => buttonInventory.clearTint())
    buttonInventory.on('pointerdown', () => {
      this.enemy.destroy()
      this.drops.forEach((drop) => drop.destroy())
      this.drops = []
      this.scene.start('Inventory')
    })

    let buttonBack = this.add.image(100, this.sys.canvas.height - 100, 'buttonBack')
    buttonBack.setInteractive({ cursor: 'pointer' })
    buttonBack.on('pointerover', () => buttonBack.setTint(0x9887ff))
    buttonBack.on('pointerout', () => buttonBack.clearTint())
    buttonBack.on('pointerdown', () => {
      this.enemy.destroy()
      this.drops.forEach((drop) => drop.destroy())
      this.drops = []
      this.scene.start('SelectTank')
    })
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta)

    // check collision between enemys and tank's bullets
    for (let bullet of this.player.getBullets()) {
      if (Phaser.Geom.Intersects.RectangleToRectangle(bullet.getBody(), this.enemy.getBody())) {
        bullet.setActive(false)
        this.enemy.setActive(false)

        // Sparks
        this.sparkEmitter0.active = true
        this.sparkEmitter1.active = true
        this.sparkEmitter0.setPosition(bullet.getBody().x, bullet.getBody().y)
        this.sparkEmitter1.setPosition(bullet.getBody().x, bullet.getBody().y)
        //@ts-ignore
        this.sparkEmitter0.explode()
        //@ts-ignore
        this.sparkEmitter1.explode()

        // Explosions
        const explosionConfig = {
          key: 'explosionAnim',
          frames: 'explosion',
          frameRate: 20,
          repeat: 0,
        }
        this.anims.create(explosionConfig)
        const anim = this.add.sprite(bullet.getBody().x, bullet.getBody().y, 'explosion')
        anim.setDepth(3)
        anim.play('explosionAnim', false)

        // Drop item
        this.drops.push(
          new Drop({
            scene: this,
            x: bullet.getBody().x,
            y: bullet.getBody().y,
            texture: this.getRandomItem(),
          }),
        )
      }
    }
    this.enemy.update()
    if (!this.enemy.active) {
      this.enemy.destroy()
      this.spawnEnemy()
    }

    // check collision between enemy and tank
    if (Phaser.Geom.Intersects.RectangleToRectangle(this.enemy.getBody(), this.player.getBody())) {
      this.enemy.destroy()
      this.drops.forEach((drop) => drop.destroy())
      this.drops = []
      this.player.setActive(false)
      this.scene.start('GameOver')
    }

    // check collision between droped item and tank
    for (let i = 0; i < this.drops.length; i++) {
      if (Phaser.Geom.Intersects.RectangleToRectangle(this.drops[i].getBody(), this.player.getBody())) {
        CONST.INVENTORY.push(this.drops[i].texture.key)
        this.drops[i].destroy()
        this.drops.splice(i, 1)
      }
    }
  }

  private getRandomItem() {
    const items = [
      'itemTurret0',
      'itemTurret1',
      'itemTurret2',
      'itemTurret3',
      'itemTurret4',
      'itemTurret5',
      'itemTurret6',
      'itemTurret7',
      'itemTurret8',
      'itemTurret9',
      'itemBody0',
      'itemBody1',
      'itemBody2',
      'itemBody3',
      'itemBody4',
      'itemBody5',
      'itemChassis0',
      'itemChassis1',
      'itemChassis2',
      'itemChassis3',
      'itemChassis4',
      'itemChassis5',
      'itemChassis6',
      'itemChassis7',
      'itemChassis8'
    ]
    const random = Phaser.Math.RND.between(0, items.length)
    return items[random]
  }

  private spawnEnemy() {
    this.enemy = new Enemy({
      scene: this,
      x: this.getRandomSpawnPostion(this.sys.canvas.width),
      y: this.getRandomSpawnPostion(this.sys.canvas.height),
      tankCode: this.getRandomEnemy(),
    })
  }

  private getRandomEnemy(): string {
    let turret = Phaser.Math.RND.between(0, 9)
    let body = Phaser.Math.RND.between(0, 5)
    let chassis = Phaser.Math.RND.between(0, 8)

    return `${turret}${body}${chassis}`
  }

  private getRandomSpawnPostion(aScreenSize: number): number {
    let rndPos = Phaser.Math.RND.between(0, aScreenSize)

    while (rndPos > aScreenSize / 3 && rndPos < (aScreenSize * 2) / 3) {
      rndPos = Phaser.Math.RND.between(0, aScreenSize)
    }

    return rndPos
  }
}
