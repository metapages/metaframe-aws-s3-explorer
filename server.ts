import { serveDir } from 'jsr:@std/http/file-server';

// Define the directory to serve files from (e.g., a "public" folder)
const STATIC_FILES_ROOT = "./dist"; 

// Start the Deno server
Deno.serve((req) => {
  // Serve files from the specified root directory
  // The 'urlRoot' option can be used to specify a different path prefix in the URL
  return serveDir(req, { fsRoot: STATIC_FILES_ROOT, urlRoot: "" }); 
}, { port: 8000 }); // Listen on port 8000

console.log(`Static file server running on http://localhost:8000 serving from ${STATIC_FILES_ROOT}`);