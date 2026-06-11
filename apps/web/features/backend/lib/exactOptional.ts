type MutableDefined<T> = T extends readonly (infer Item)[]
    ? MutableDefined<Item>[]
    : T extends object
      ? { -readonly [K in keyof T]: MutableDefined<Exclude<T[K], undefined>> }
      : Exclude<T, undefined>;

export function omitUndefined<const T extends Record<string, unknown>>(
    input: T,
) {
    return Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined),
    ) as {
        -readonly [K in keyof T]: MutableDefined<T[K]>;
    };
}
