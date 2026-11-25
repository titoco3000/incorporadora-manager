// Viewer-request function (cloudfront-js-2.0), default (S3) behavior only, never /api/*.
// SvelteKit SPA: any path without a file extension is a client-side route → /index.html.
// Files (/_app/..., /robots.txt, /favicon.png) pass through unchanged.
function handler(event) {
  var req = event.request;
  var last = req.uri.split('/').pop();
  if (last.indexOf('.') === -1) {
    req.uri = '/index.html';
  }
  return req;
}
