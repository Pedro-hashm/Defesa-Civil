import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rotas públicas que não precisam de proteção
  if (
    pathname === "/" ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/img") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // 2. Tenta pegar as credenciais nos Cookies
  const token = request.cookies.get("defesa-civil.token")?.value;
  const cargo = request.cookies.get("defesa-civil.cargo")?.value;

  // Se não tem token ou cargo, expulsa para a tela de login
  if (!token || !cargo) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ==========================================
  // REGRAS DE ACESSO DO ALUNO
  // ==========================================
  if (cargo === "ALUNO") {
    // Aluno só pode acessar essas 3 rotas (e suas sub-rotas)
    const isRotaPermitida =
      pathname.startsWith("/minhas-respostas") ||
      pathname.startsWith("/simulador") ||
      pathname.startsWith("/comunicados");

    if (!isRotaPermitida) {
      return NextResponse.redirect(new URL("/comunicados", request.url));
    }
  }

  // ==========================================
  // REGRAS DE ACESSO DO ADMIN
  // ==========================================
  if (cargo === "ADMIN") {
    // 👇 Admin agora só é bloqueado na tela de "Minhas Respostas"
    const isRotaProibida = pathname.startsWith("/minhas-respostas");

    if (isRotaProibida) {
      return NextResponse.redirect(new URL("/comunicados", request.url));
    }
  }

  // Se passou por todas as regras, libera o acesso!
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|img).*)",
  ],
};