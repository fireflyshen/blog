import { g as generateOgImageForSite } from './index_aPCd7DZ4.mjs';

const GET = async () => new Response(await generateOgImageForSite(), {
  headers: { "Content-Type": "image/png" }
});

export { GET };
