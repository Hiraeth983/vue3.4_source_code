export function effect(fn, options?) {
  // 创建响应式的 effect 每次数据变化后都会重新执行

  // 创建响应式的 effect 只要依赖的属性发生变化就会执行回调
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  // 立刻执行 页面渲染
  _effect.run();

  if (options) {
    Object.assign(_effect, options);
  }

  const runner = _effect.run.bind(_effect); // 绑定 this
  runner.effect = _effect;

  return runner; // 返回 runner 供用户使用
}

// 存储当前激活的 effect
export let activeEffect;

function preCleanEffect(effect) {
  effect._depsLength = 0;
  effect._trackId++; // 副作用函数触发的次数加 1，当前同一个副作用函数执行，_trackId 相同
}

function postCleanEffect(effect) {
  if (effect._depsLength < effect.deps.length) {
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanDepEffect(effect.deps[i], effect);
    }

    effect.deps.length = effect._depsLength;
  }
}

class ReactiveEffect {
  public _trackId = 0; // 用于标识副作用函数触发的次数
  public _depsLength = 0; // 依赖的次数
  public _running = 0;
  public deps = []; // 存储当前副作用函数存储在哪个依赖映射表里
  public active = true; // 是否激活 可能会停止响应式 effect

  // fn 用户编写的函数
  // scheduler 调度函数 fn中依赖的数据发生变化时需要重新执行 run
  constructor(public fn, public scheduler) {}
  run() {
    // 未激活状态下直接执行，不进行依赖收集
    if (!this.active) {
      return this.fn();
    }
    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      // 副作用函数重新执行前，需要将上一次收集的依赖 effect.deps 清空
      preCleanEffect(this);
      // 每次执行前去判断是否存在同一个副作用函数在执行
      this._running++;
      return this.fn();
    } finally {
      // 执行完后，将 _running 减 1
      this._running--;
      // 若收集完依赖后，旧的依赖列表较长，需要将多余的部分删除
      postCleanEffect(this);
      // 将上一个激活的 effect 重新赋值 用于嵌套的 effect 或者设置激活的 effect 为 undefined
      // undefined 代表当前依赖的数据变化并不是在 effect 函数中发生的，不需要进行依赖收集
      activeEffect = lastEffect;
    }
  }
}

function cleanDepEffect(dep, effect) {
  console.log("cleanDepEffect", dep, effect);
  
  dep.delete(effect);
  if (dep.size === 0) {
    dep.cleanup(); // 如果 map 为空，删除掉对应的依赖（清除依赖的函数）
  }
}

// 双向记忆
// 1._trackId 用于记录执行次数（防止某个属性在当前effect中多次收集依赖，只收集一次）
// 2.拿到上一次该副作用函数的依赖数组，并于本次比较
export function trackEffect(effect: ReactiveEffect, dep) {
  // 需要重新去收集依赖，不需要的删除掉
  debugger
  if (dep.get(effect) !== effect._trackId) {
    dep.set(effect, effect._trackId); // 更新 _trackId

    let oldDep = effect.deps[effect._depsLength];
    if (oldDep !== dep) {
      if (oldDep) {
        cleanDepEffect(oldDep, effect);
      }
      effect.deps[effect._depsLength++] = dep;
    } else {
      effect._depsLength++;
    }
  }
}

export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    if (!effect._running) { // 判断是否正在执行
      if (effect.scheduler) {
        effect.scheduler();
      }
    }
  }
}
