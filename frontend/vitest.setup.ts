import { beforeEach, vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8080");
vi.stubEnv("NEXT_PUBLIC_SENHA_PREFIXO", "dc@");
vi.stubEnv("NEXT_PUBLIC_SENHA_SUFIXO", "@dc");

beforeEach(() => {
  localStorage.clear();
});
