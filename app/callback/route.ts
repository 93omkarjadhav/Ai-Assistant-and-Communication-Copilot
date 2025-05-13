// import { handleAuth } from "@workos-inc/authkit-nextjs";

// // Redirect the user to `/` after successful sign in
// // The redirect can be customized: `handleAuth({ returnPathname: '/foo' })`
// export const GET = handleAuth();

import { handleAuth } from "@workos-inc/authkit-nextjs";

// Redirect the user to `/` (homepage) after successful sign in
export const GET = handleAuth({
  returnPathname: '/', // Ensure your homepage is accessible and renders the Copilot
});

