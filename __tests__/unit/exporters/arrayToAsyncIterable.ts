export async function* arrayToAsyncIterable<T>(
  array: readonly T[],
): AsyncIterable<T> {
  for (const element of array) {
    yield element;
  }
}
