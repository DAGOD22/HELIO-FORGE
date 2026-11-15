// Vercel Node Function: reuse the same validated routes as the Express server.
// Static files are served by Vercel, never by the function.
import {createApp} from '../server/app.js';
export default createApp({serveStatic:false});
