/** The cache keys of the health domain (ADR 0017): every key of the domain starts with `all()`. */
export const healthQueryKeys = {
  all: () => ['health'] as const,
  get: () => [...healthQueryKeys.all(), 'get'] as const,
}
