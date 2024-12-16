import { EventDispatcher, Object3D } from 'three';
import SoonSpace, { AnimationModeType, IVector3 } from 'soonspacejs';
import { TAnimationFrame, TEventMap, TTransformObject, TTweenSource, TTweenType } from './types';

const { animation } = SoonSpace;

const initialTransformSymbol = Symbol('initialTransform');

class AnimationPlayer extends EventDispatcher<TEventMap> {
  tweenSet: Set<TTweenType> = new Set();

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
      } satisfies TTransformObject;
      Reflect.set(this.target, initialTransformSymbol, transformObject);
    }
  }

  getInitialTransform(): TTransformObject | undefined {
    return Reflect.get(this.target, initialTransformSymbol);
  }

  async play(frames: TAnimationFrame[]) {
    this.initTransform();

    const initialTransform = this.getInitialTransform() as TTransformObject;

    /**
     * 执行动画
     */
    for (let j = 0; j < frames.length; j++) {
      let currentFrame: TTransformObject = frames[j - 1];

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

      await animation<TTweenSource>(
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
        (source, tween) => {
          const { positionX, positionY, positionZ, rotationX, rotationY, rotationZ, scaleX, scaleY, scaleZ } = source;
          this.target.position.set(positionX, positionY, positionZ);
          this.target.rotation.set(rotationX, rotationY, rotationZ);
          this.target.scale.set(scaleX, scaleY, scaleZ);
          this.dispatchEvent({ type: 'update', source, tween });
        },
        (tween) => {
          this.tweenSet.add(tween);
          this.dispatchEvent({ type: 'start', tween });
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
