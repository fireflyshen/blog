import { a as createComponent, r as renderTemplate, m as maybeRenderHead, u as unescapeHTML } from './astro_TRbxTWHF.mjs';
import 'kleur/colors';
import 'clsx';

const html = "";

				const frontmatter = {"author":"fireflyshen","pubDatetime":"2024-06-02T16:43:00.000Z","modDatetime":"2024-06-02T16:44:00.000Z","title":"向内追寻","slug":"seek inward","featured":true,"draft":false,"tags":["introspection"],"description":"“智者恒于内省，追寻心灵的深邃与宁静，因而自得其乐；而愚者执着于外界的虚幻追求，终其一生，求而不得。”"};
				const file = "/Users/firefly/Blog/blog/src/content/blog/向内追寻.md";
				const url = undefined;
				function rawContent() {
					return "";
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

					return renderTemplate`${maybeRenderHead()}${unescapeHTML(html)}`;
				});

export { Content, compiledContent, Content as default, file, frontmatter, getHeadings, rawContent, url };
