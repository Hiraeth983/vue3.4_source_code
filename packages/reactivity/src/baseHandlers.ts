import { isObject } from "@vue/shared";
import { ReactiveFlags } from "./constants";
import { track, trigger } from "./reactiveEffect";
import { reactive } from "./reactive";

// 代理基础操作
export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    // 判断是否是响应式数据
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    // 当取值的时候，依赖收集
    track(target, key);

    let result = Reflect.get(target, key, receiver);
    if (isObject(result)) {
      return reactive(result);
    }

    return result;
  },
  set(target, key, value, receiver) {
    // 当设置值的时候，触发收集的副作用函数
    let oldValue = target[key];

    let result = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      // 需要触发页面更新
      trigger(target, key, value, oldValue);
    }

    return result;
  },
};