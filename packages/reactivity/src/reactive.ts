import { isObject } from "@vue/shared";
import { ReactiveFlags } from "./constants";
import { mutableHandlers } from "./baseHandlers";

// 存储响应式数据
const reactiveProxyMap = new WeakMap();

export function reactive(target) {
  return createProxyObject(target);
}

function createProxyObject(target) {
  // 判断是否是对象 响应式对象代理的必须是对象
  if (!isObject(target)) {
    return target;
  }
  // 判断是否是响应式数据
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }

  // 判断是否已经存在代理对象
  let existProxyObject = reactiveProxyMap.get(target);
  if (existProxyObject) {
    return existProxyObject;
  }

  let proxy = new Proxy(target, mutableHandlers);
  // 存储响应式数据 便于取值
  reactiveProxyMap.set(target, proxy);
  return proxy;
}

export function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}