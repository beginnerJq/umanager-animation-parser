import { EventDispatcher } from 'three';
import SoonSpace from 'soonspacejs';

const { animation } = SoonSpace;
const initialTransformSymbol = Symbol('initialTransform');
class AnimationPlayer extends EventDispatcher {
    constructor(ssp, target) {
        super();
        this.ssp = ssp;
        this.target = target;
        this.tweenSet = new Set();
    }
    initTransform() {
        const { position, rotation, scale } = this.target;
        if (!Reflect.has(this.target, initialTransformSymbol)) {
            const transformObject = {
                position: position.clone(),
                rotation: rotation.clone(),
                scale: scale.clone(),
            };
            Reflect.set(this.target, initialTransformSymbol, transformObject);
        }
    }
    getInitialTransform() {
        return Reflect.get(this.target, initialTransformSymbol);
    }
    async play(frames) {
        var _a, _b, _c, _d;
        this.initTransform();
        const initialTransform = this.getInitialTransform();
        /**
         * 执行动画
         */
        for (let j = 0; j < frames.length; j++) {
            let currentFrame = frames[j - 1];
            if (!currentFrame) {
                currentFrame = initialTransform;
            }
            const nextFrame = frames[j];
            const sourcePosition = currentFrame.position, sourceRotation = currentFrame.rotation, sourceScale = currentFrame.scale;
            const targetPosition = nextFrame.position, targetRotation = nextFrame.rotation, targetScale = nextFrame.scale;
            const delay = (_a = nextFrame.delay) !== null && _a !== void 0 ? _a : 0;
            const duration = (_b = nextFrame.duration) !== null && _b !== void 0 ? _b : 1000;
            const mode = nextFrame.easing;
            /**
             * -1 表示无限循环
             */
            const repeat = nextFrame.repeat === -1 ? Infinity : (_c = nextFrame.repeat) !== null && _c !== void 0 ? _c : 0;
            const yoyo = (_d = nextFrame.yoyo) !== null && _d !== void 0 ? _d : false;
            await animation({
                positionX: sourcePosition.x,
                positionY: sourcePosition.y,
                positionZ: sourcePosition.z,
                rotationX: sourceRotation.x,
                rotationY: sourceRotation.y,
                rotationZ: sourceRotation.z,
                scaleX: sourceScale.x,
                scaleY: sourceScale.y,
                scaleZ: sourceScale.z,
            }, {
                positionX: targetPosition.x,
                positionY: targetPosition.y,
                positionZ: targetPosition.z,
                rotationX: targetRotation.x,
                rotationY: targetRotation.y,
                rotationZ: targetRotation.z,
                scaleX: targetScale.x,
                scaleY: targetScale.y,
                scaleZ: targetScale.z,
            }, { delay, duration, mode, repeat, yoyo }, (source, tween) => {
                const { positionX, positionY, positionZ, rotationX, rotationY, rotationZ, scaleX, scaleY, scaleZ } = source;
                this.target.position.set(positionX, positionY, positionZ);
                this.target.rotation.set(rotationX, rotationY, rotationZ);
                this.target.scale.set(scaleX, scaleY, scaleZ);
                this.dispatchEvent({ type: 'update', source, tween });
            }, (tween) => {
                this.tweenSet.add(tween);
                this.dispatchEvent({ type: 'start', tween });
            });
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
