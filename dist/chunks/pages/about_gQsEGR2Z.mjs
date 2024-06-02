import { c as createAstro, a as createComponent, r as renderTemplate, f as renderComponent, m as maybeRenderHead, d as renderSlot, u as unescapeHTML } from '../astro_TRbxTWHF.mjs';
import 'kleur/colors';
import 'clsx';
import { S as SITE, c as $$Layout, a as $$Header, b as $$Footer } from './404_KhQamH6Z.mjs';
import { $ as $$Breadcrumbs } from './_page__fakqKCtu.mjs';

const $$Astro = createAstro("https://blog.catshen.live");
const $$AboutLayout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$AboutLayout;
  const { frontmatter } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `${frontmatter.title} | ${SITE.title}` }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, { "activeNav": "about" })} ${renderComponent($$result2, "Breadcrumbs", $$Breadcrumbs, {})} ${maybeRenderHead()}<main id="main-content"> <section id="about" class="prose mb-28 max-w-3xl prose-img:border-0"> <h1 class="text-2xl tracking-wider sm:text-3xl">${frontmatter.title}</h1> ${renderSlot($$result2, $$slots["default"])} </section> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/Users/firefly/Blog/blog/src/layouts/AboutLayout.astro", void 0);

const html = "<p>暂时空着😄</p>";

				const frontmatter = {"layout":"../layouts/AboutLayout.astro","title":"About"};
				const file = "/Users/firefly/Blog/blog/src/pages/about.md";
				const url = "/about";
				function rawContent() {
					return "暂时空着😄";
				}
				function compiledContent() {
					return html;
				}
				function getHeadings() {
					return [];
				}

				const Content = createComponent((result, _props, slots) => {
					const { layout, ...content } = frontmatter;
					content.file = file;
					content.url = url;

					return renderTemplate`${renderComponent(result, 'Layout', $$AboutLayout, {
								file,
								url,
								content,
								frontmatter: content,
								headings: getHeadings(),
								rawContent,
								compiledContent,
								'server:root': true,
							}, {
								'default': () => renderTemplate`${unescapeHTML(html)}`
							})}`;
				});

export { Content, compiledContent, Content as default, file, frontmatter, getHeadings, rawContent, url };
