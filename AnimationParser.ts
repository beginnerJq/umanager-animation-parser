import { EventDispatcher, Object3D } from 'three';
import { Tween } from 'three/examples/jsm/libs/tween.module.js';
import SoonSpace, { AnimationModeType, IVector3 } from 'soonspacejs';

const { animation } = SoonSpace;

const initialTransformSymbol = Symbol('initialTransform');

export type AnimationFrame = {
  position: IVector3;
  rotation: IVector3;
  scale: IVector3;
  duration: number;
  delay: number;
  repeat: number;
  yoyo: boolean;
  easing: AnimationModeType;
};

export type TransformObject = Pick<AnimationFrame, 'position' | 'rotation' | 'scale'>;

class AnimationPlayer extends EventDispatcher<{ update: object }> {
  tweenSet: Set<Tween<any>> = new Set();

  constructor(readonly ssp: SoonSpace, readonly target: Object3D) {
    super();
  }

  initTransform() {
    const { position, rotation, scale } = this.target;

    if (!Reflect.has(this.target, initialTransformSymbol)) {
      const transformObject = {
        position: position.clone(),
        rotation: rotation.clone(),
        scale: scale.clone(),
      } satisfies TransformObject;
      Reflect.set(this.target, initialTransformSymbol, transformObject);
    }
  }

  getInitialTransform(): TransformObject | undefined {
    return Reflect.get(this.target, initialTransformSymbol);
  }

  async play(frames: AnimationFrame[]) {
    this.initTransform();

    const initialTransform = this.getInitialTransform() as TransformObject;

    /**
     * 执行动画
     */
    for (let j = 0; j < frames.length; j++) {
      let currentFrame: TransformObject = frames[j - 1];

      if (!currentFrame) {
        currentFrame = initialTransform;
      }

      const nextFrame = frames[j];

      const sourcePosition = currentFrame.position as IVector3,
        sourceRotation = currentFrame.rotation as IVector3,
        sourceScale = currentFrame.scale as IVector3;
      const targetPosition = nextFrame.position as IVector3,
        targetRotation = nextFrame.rotation as IVector3,
        targetScale = nextFrame.scale as IVector3;

      const delay = nextFrame.delay ?? 0;
      const duration = nextFrame.duration ?? 1000;
      const mode = nextFrame.easing as AnimationModeType;
      /**
       * -1 表示无限循环
       */
      const repeat = nextFrame.repeat === -1 ? Infinity : nextFrame.repeat ?? 0;

      const yoyo = nextFrame.yoyo ?? false;

      await animation(
        {
          positionX: sourcePosition.x,
          positionY: sourcePosition.y,
          positionZ: sourcePosition.z,
          rotationX: sourceRotation.x,
          rotationY: sourceRotation.y,
          rotationZ: sourceRotation.z,
          scaleX: sourceScale.x,
          scaleY: sourceScale.y,
          scaleZ: sourceScale.z,
        },
        {
          positionX: targetPosition.x,
          positionY: targetPosition.y,
          positionZ: targetPosition.z,
          rotationX: targetRotation.x,
          rotationY: targetRotation.y,
          rotationZ: targetRotation.z,
          scaleX: targetScale.x,
          scaleY: targetScale.y,
          scaleZ: targetScale.z,
        },
        { delay, duration, mode, repeat, yoyo },
        ({ positionX, positionY, positionZ, rotationX, rotationY, rotationZ, scaleX, scaleY, scaleZ }) => {
          this.target.position.set(positionX, positionY, positionZ);
          this.target.rotation.set(rotationX, rotationY, rotationZ);
          this.target.scale.set(scaleX, scaleY, scaleZ);
          this.dispatchEvent({ type: 'update' });
        },
        (tween) => {
          this.tweenSet.add(tween);
        }
      );
    }
  }

  stop() {
    this.tweenSet.forEach((tween) => tween.stop());
    this.tweenSet.clear();
  }

  reset() {
    const initialTransform = this.getInitialTransform();

    if (initialTransform) {
      const { position, rotation, scale } = initialTransform;
      this.target.position.copy(position);
      this.target.rotation.set(rotation.x, rotation.y, rotation.z);
      this.target.scale.copy(scale);
      this.ssp.render();
    }
  }

  dispose() {
    this.stop();
    this.reset();
    Reflect.deleteProperty(this.target, initialTransformSymbol);
  }
}

export { AnimationPlayer };
