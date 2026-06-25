import { vi } from "vitest";

vi.stubEnv("PASSWORD_PREFIXO", "srv@");
vi.stubEnv("PASSWORD_SUFIXO", "@srv");
vi.stubEnv("FRONTEND_URL", "http://localhost:3000");
vi.stubEnv("FRONTEND_SENHA_PREFIXO", "dc@");
vi.stubEnv("FRONTEND_SENHA_SUFIXO", "@dc");
