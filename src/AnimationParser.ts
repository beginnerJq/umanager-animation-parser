import { EventDispatcher, Object3D } from 'three';
import SoonSpace from 'soonspacejs';
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

      const sourcePosition = currentFrame.position,
        sourceRotation = currentFrame.rotation,
        sourceScale = currentFrame.scale;
      const targetPosition = nextFrame.position,
        targetRotation = nextFrame.rotation,
        targetScale = nextFrame.scale;

      const delay = nextFrame.delay ?? 0;
      const duration = nextFrame.duration ?? 1000;
      const mode = nextFrame.easing;
      /**
       * -1 表示无限循环
       */
      const repeat = nextFrame.repeat === -1 ? Infinity : nextFrame.repeat ?? 0;

      const yoyo = nextFrame.yoyo ?? false;

      await animation<TTweenSource>(
        {
          x: sourcePosition.x,
          y: sourcePosition.y,
          z: sourcePosition.z,
          rotationX: sourceRotation.x,
          rotationY: sourceRotation.y,
          rotationZ: sourceRotation.z,
          scaleX: sourceScale.x,
          scaleY: sourceScale.y,
          scaleZ: sourceScale.z,
        },
        {
          x: targetPosition.x,
          y: targetPosition.y,
          z: targetPosition.z,
          rotationX: targetRotation.x,
          rotationY: targetRotation.y,
          rotationZ: targetRotation.z,
          scaleX: targetScale.x,
          scaleY: targetScale.y,
          scaleZ: targetScale.z,
        },
        { delay, duration, mode, repeat, yoyo },
        (source, tween) => {
          const { x, y, z, rotationX, rotationY, rotationZ, scaleX, scaleY, scaleZ } = source;
          this.target.position.set(x, y, z);
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
