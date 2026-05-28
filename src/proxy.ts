import { withAuth } from "next-auth/middleware";

// /admin is intentionally not listed — the page component handles
// admin-vs-portal rendering itself, and /api/admin/* routes are
// protected individually by getServerSession.
export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/cart/checkout",
    "/profile/:path*",
    "/wishlist/:path*",
  ],
};
