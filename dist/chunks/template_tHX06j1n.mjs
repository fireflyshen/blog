import { a as createComponent, r as renderTemplate, m as maybeRenderHead, u as unescapeHTML } from './astro_TRbxTWHF.mjs';
import 'kleur/colors';
import 'clsx';

const html = "<p>formatter template！！！\n测试自动化部署指令\n二次测试</p>";

				const frontmatter = {"author":"Sat Naing","pubDatetime":"2022-09-23T15:22:00.000Z","modDatetime":"2023-12-21T09:12:47.400Z","title":"formatter Template","slug":"formatter-Template","featured":false,"draft":false,"tags":["docs"],"description":"formatter template"};
				const file = "/Users/firefly/Blog/blog/src/content/blog/template.md";
				const url = undefined;
				function rawContent() {
					return "\nformatter template！！！\n测试自动化部署指令\n二次测试\n";
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
