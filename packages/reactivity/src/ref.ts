import { activeEffect, trackEffect, triggerEffects } from "./effect";
import { toReactive } from "./reactive";
import { createDep } from "./reactiveEffect";

export function ref(value) {
  return createRef(value);
}

function createRef(value) {
  return new RefImpl(value);
}

class RefImpl {
  public __v_isRef = true; // 标记是否是 ref
  public _value; // 用于保存 ref 的值

  public dep; // 用于收集对应的 effect

  constructor(public rawValue) {
    this._value = toReactive(rawValue);
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this.rawValue = newValue; // 更新原始值
      this._value = toReactive(newValue);
      triggerRefValue(this);
    }
  }
}

function trackRefValue(ref) {
  if (activeEffect) {
    trackEffect(
      activeEffect,
      ref.dep = createDep(() => (ref.dep = undefined), "undefined")
    );
  }
}

function triggerRefValue(ref) {
  const dep = ref.dep;
  console.log("triggerRefValue", ref);
  if (dep) {
    triggerEffects(dep); // 触发依赖更新
  }
}

// toRef 和 toRefs
class ObjectRefImpl {
  public __v_isRef = true;

  constructor(public _obj, public _key) { }
  
  get value() {
    return this._obj[this._key];
  }
  set value(newValue) {
    this._obj[this._key] = newValue;
  }
}

export function toRef(obj, key) {
  return new ObjectRefImpl(obj, key);
}

export function toRefs(obj) {
  // 目前仅考虑对象，数组暂时不考虑
  const res = {};
  for (const key in obj) {
    res[key] = toRef(obj, key);
  }
  return res;
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key, receiver) {
      let result = Reflect.get(target, key, receiver);
      return result.__v_isRef ? result.value : result;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      if(oldValue.__v_isRef) {
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    },
  });
}