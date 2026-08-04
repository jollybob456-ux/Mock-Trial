/**
 * Decap CMS <-> GitHub OAuth proxy for Allen Mock Trial admin dashboard.
 *
 * Deploy this as a Cloudflare Worker. It needs two secret environment
 * variables set in the Worker's settings:
 *   GITHUB_CLIENT_ID
 *   GITHUB_CLIENT_SECRET
 * (You get both from the GitHub OAuth App you create.)
 *
 * Routes:
 *   /auth      -> redirects the user to GitHub to log in / approve access
 *   /callback  -> GitHub sends the user back here; we exchange the code
 *                 for a token and hand it back to the Decap CMS popup.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/auth") {
      const redirectUri = `${url.origin}/callback`;
      const authUrl =
        "https://github.com/login/oauth/authorize" +
        `?client_id=${env.GITHUB_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=repo`;
      return Response.redirect(authUrl, 302);
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return new Response("Missing code from GitHub.", { status: 400 });
      }

      const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code: code,
        }),
      });

      const tokenData = await tokenResp.json();

      if (tokenData.error) {
        return new Response(
          "GitHub OAuth error: " + (tokenData.error_description || tokenData.error),
          { status: 400 }
        );
      }

      const payload = JSON.stringify({ token: tokenData.access_token, provider: "github" });
      const message = `authorization:github:success:${payload}`;

      const html = `<!DOCTYPE html>
<html><body>
<p>Login successful — you can close this window.</p>
<script>
(function() {
  function receiveMessage(e) {
    window.opener.postMessage(
      ${JSON.stringify(message)},
      e.origin
    );
    window.removeEventListener("message", receiveMessage, false);
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script>
</body></html>`;

      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    return new Response("Not found. Try /auth to log in.", { status: 404 });
  },
};
