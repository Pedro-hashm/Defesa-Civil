export function deepParseJSON<T = unknown>(obj: T): T {
  if (typeof obj === "string") {
    try {
      return deepParseJSON(JSON.parse(obj) as unknown) as T;
    } catch {
      return obj;
    }
  }

  if (obj !== null && typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.map((item) => deepParseJSON(item)) as T;
    }

    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      newObj[key] = deepParseJSON((obj as Record<string, unknown>)[key]);
    }
    return newObj as T;
  }

  return obj;
}

export function parseRespostas(respostas: unknown): Record<string, unknown> {
  if (typeof respostas === "string") {
    try {
      return parseRespostas(JSON.parse(respostas));
    } catch {
      return {};
    }
  }
  return (respostas as Record<string, unknown>) || {};
}
