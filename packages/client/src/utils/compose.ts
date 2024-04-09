type ArrayElement<A> = A extends Array<infer X> ? X : never;
type LastTupleArg<T> = T extends [...rest: infer _, final: infer Y]
  ? Y extends (...arg: infer Z) => infer _
    ? ArrayElement<Z>
    : never
  : never;

type FirstTupleReturn<T> = T extends [initial: infer X, ...rest: infer _]
  ? X extends (...args: infer _) => infer R
    ? R
    : never
  : never;

export const compose =
  <T extends Array<any>>(...funcs: T) =>
  (x: LastTupleArg<T>): FirstTupleReturn<T> =>
    funcs.reduceRight((acc, func) => func(acc), x);
