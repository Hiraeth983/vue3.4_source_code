import { activeEffect, trackEffect, triggerEffects } from "./effect";

// 存储依赖的结构
const targetMap = new WeakMap();

// 创建依赖映射表并添加 cleanup 属性
export function createDep(cleanup, name) {
  let dep = new Map() as any;
  dep.cleanup = cleanup; // 存储清除依赖的函数
  dep.name = name;
  return dep;
}

export function track(target, key) {
  // activeEffect 存在代表是在 effect 中调用的
  if (activeEffect) {
    let depsMap = targetMap.get(target);

    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
    }

    let dep = depsMap.get(key);

    if (!dep) {
      depsMap.set(
        key,
        (dep = createDep(() => depsMap.delete(key), key))
      );
    }

    trackEffect(activeEffect, dep); // 将当前的 effect 存储到 dep（映射表） 中
  }
}

export function trigger(target, key, value, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }

  const dep = depsMap.get(key);
  if (dep) {
    triggerEffects(dep);
  }
}
