import { Bullet } from './bullet'
import { CONST } from '../const/const'
import { ITankConstructor } from '../interfaces/tank.interface'

export class Tank extends Phaser.GameObjects.Container {
  body: Phaser.Physics.Arcade.Body

  private velocity: Phaser.Math.Vector2
  private cursors: any
  private bullets: Bullet[]
  private shootKey: Phaser.Input.Keyboard.Key
  private isShooting: boolean
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter
  private partChassisB: Phaser.GameObjects.Image
  private partChassisA: Phaser.GameObjects.Image
  private partBody: Phaser.GameObjects.Image
  private partTurret: Phaser.GameObjects.Image

  public getBullets(): Bullet[] {
    return this.bullets
  }

  public getBody(): any {
    return this.body
  }

  constructor(aParams: ITankConstructor) {
    super(aParams.scene, aParams.x, aParams.y)

    // variables
    this.bullets = []
    this.isShooting = false

    // init tank
    this.initTank()
    this.setDepth(2)

    // input
    this.cursors = this.scene.input.keyboard.createCursorKeys()
    this.shootKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    // physics
    this.scene.physics.world.enable(this)
    this.body.allowGravity = false
    this.body.setSize(CONST.TANK_SIZE * 2, CONST.TANK_SIZE * 2)
    this.body.setOffset(-CONST.TANK_SIZE, -CONST.TANK_SIZE)

    this.partTurret = new Phaser.GameObjects.Image(this.scene, 0, 0, `partTurret${aParams.tankCode[0]}`)
    this.partBody = new Phaser.GameObjects.Image(this.scene, 0, 0, `partBody${aParams.tankCode[1]}`)
    this.partChassisA = new Phaser.GameObjects.Image(this.scene, 0, 0, `partChassisA${aParams.tankCode[2]}`)
    this.partChassisB = new Phaser.GameObjects.Image(this.scene, 0, 0, `partChassisB${aParams.tankCode[2]}`)
    this.add([this.partChassisB, this.partBody, this.partChassisA, this.partTurret])

    this.scene.add.existing(this)

    // boost particles
    const tank = this
    const particles = this.scene.add.particles('particleBlue')
    this.emitter = particles.createEmitter({
      speed: 100,
      lifespan: {
        onEmit: () => {
          const speed = Math.sqrt(Math.pow(tank.velocity.x, 2) + Math.pow(tank.velocity.y, 2))
          return Phaser.Math.Percent(speed, 0, 5) * 2000
        },
      },
      alpha: {
        onEmit: () => {
          const speed = Math.sqrt(Math.pow(tank.velocity.x, 2) + Math.pow(tank.velocity.y, 2))
          return Phaser.Math.Percent(speed, 0, 5)
        },
      },
      angle: {
        onEmit: () => {
          var v = Phaser.Math.Between(-10, 10)
          return Phaser.Math.RadToDeg(tank.rotation) - 180 + v
        },
      },
      scale: { start: 0.6, end: 0 },
      blendMode: 'ADD',
    })
    this.emitter.startFollow(this, 0, 0)
  }

  private initTank(): void {
    // define tank properties
    this.x = this.scene.sys.canvas.width / 2
    this.y = this.scene.sys.canvas.height / 2
    this.velocity = new Phaser.Math.Vector2(0, 0)
  }

  update(time: number, delta: number): void {
    if (this.active) {
      this.handleInput()
    }
    this.applyEffects(time)
    this.applyForces()
    this.checkIfOffScreen()
    this.updateBullets()
    this.emitter.startFollow(this, -70 * Math.sin(this.rotation), 70 * Math.cos(this.rotation))
  }

  private applyEffects(time: number): void {
    if (this.cursors.up.isDown || this.cursors.down.isDown) {
      this.partBody.x = (time % 2) - 1
      this.partBody.y = (time % 2) - 1
    }

    if (this.isShooting && this.partChassisB.y < 20) {
      this.partChassisB.y += 2
    } else {
      this.partChassisB.y = 0
    }

    if (this.cursors.right.isDown || this.cursors.left.isDown) {
      if (this.cursors.right.isDown && this.partChassisA.angle > -6) this.partChassisA.angle -= 1
      if (this.cursors.left.isDown && this.partChassisA.angle < 6) this.partChassisA.angle += 1
    } else {
      if (this.partChassisA.angle > -6 && this.partChassisA.angle < 0) this.partChassisA.angle += 1
      if (this.partChassisA.angle < 6 && this.partChassisA.angle > 0) this.partChassisA.angle -= 1
    }
  }

  private handleInput(): void {
    if (this.cursors.up.isDown) {
      this.boost()
    }

    if (this.cursors.right.isDown) {
      this.rotation += 0.05
    } else if (this.cursors.left.isDown) {
      this.rotation -= 0.05
    }

    if (this.shootKey.isDown && !this.isShooting) {
      this.shoot()
      this.recoil()
      this.isShooting = true
    }

    if (this.shootKey.isUp) {
      this.isShooting = false
    }
  }

  private boost(): void {
    // create the force in the correct direction
    let force = new Phaser.Math.Vector2(Math.cos(this.rotation - Math.PI / 2), Math.sin(this.rotation - Math.PI / 2))

    // reduce the force and apply it to the velocity
    force.scale(0.3)
    this.velocity.add(force)
  }

  private applyForces(): void {
    // apple velocity to position
    this.x += this.velocity.x
    this.y += this.velocity.y

    // reduce the velocity
    this.velocity.scale(0.98)
  }

  private checkIfOffScreen(): void {
    // horizontal check
    if (this.x > this.scene.sys.canvas.width + CONST.TANK_SIZE) {
      this.x = -CONST.TANK_SIZE
    } else if (this.x < -CONST.TANK_SIZE) {
      this.x = this.scene.sys.canvas.width + CONST.TANK_SIZE
    }

    // vertical check
    if (this.y > this.scene.sys.canvas.height + CONST.TANK_SIZE) {
      this.y = -CONST.TANK_SIZE
    } else if (this.y < -CONST.TANK_SIZE) {
      this.y = this.scene.sys.canvas.height + CONST.TANK_SIZE
    }
  }

  private shoot(): void {
    this.bullets.push(
      new Bullet({
        scene: this.scene,
        x: this.x,
        y: this.y,
        rotation: this.rotation,
        texture: 'bullet',
      }),
    )
  }

  private recoil(): void {
    // create the force in the correct direction
    let force = new Phaser.Math.Vector2(-Math.cos(this.rotation - Math.PI / 2), -Math.sin(this.rotation - Math.PI / 2))

    // reduce the force and apply it to the velocity
    force.scale(0.2)
    this.velocity.add(force)
  }

  private updateBullets(): void {
    for (let i = 0; i < this.bullets.length; i++) {
      if (this.bullets[i].active) {
        this.bullets[i].update()
      } else {
        this.bullets[i].destroy()
        this.bullets.splice(i, 1)
      }
    }
  }
}
