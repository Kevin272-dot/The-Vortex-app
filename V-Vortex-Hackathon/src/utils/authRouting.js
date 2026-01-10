export const ROUTES = {
  login: "/login",
  otp: "/otp",
  register: "/register",
  leaderDashboard: "/dashboard",
  memberDashboard: "/member",
};

export function routeForContext(context) {
  if (!context) {
    return ROUTES.login;
  }

  if (context.role === "team_leader") {
    return context.teamId ? ROUTES.leaderDashboard : ROUTES.register;
  }

  if (context.role === "team_member") {
    return context.teamId ? ROUTES.memberDashboard : ROUTES.register;
  }

  return ROUTES.register;
}
