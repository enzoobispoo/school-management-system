/** Destino após login ou quando o usuário acessa "/" no papel escolar. */
export function defaultHomePathForRole(role: string | undefined | null): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/admin";
    case "PROFESSOR":
      return "/docente";
    case "FINANCEIRO":
      return "/financeiro";
    case "SECRETARIA":
    case "SECRETARIA_FINANCEIRA":
      return "/secretaria";
    case "ADMIN":
    default:
      return "/";
  }
}
