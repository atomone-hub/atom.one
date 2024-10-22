const MarkdownIt = require("markdown-it");
const markdownItGitHubAlerts = require("markdown-it-github-alerts");
const fs = require("fs-extra");
const path = require("path");

const md = new MarkdownIt({
  html: true,
});
md.use(markdownItGitHubAlerts);

const rootDir = __dirname;
const outputDir = path.join(rootDir, "dist");
const staticDir = path.join(rootDir, "site/static");

const loadTemplate = (filePath) => fs.readFileSync(filePath, "utf-8");

const template = (content, title, header, footer) => {
  const layout = loadTemplate(path.join(rootDir, "site/templates/layout.html"));
  return layout.replace("{{ header }}", header).replace("{{ footer }}", footer).replace("{{ content }}", content).replace("{{ title }}", title.replace(/-/g, " "));
};

const generateNavLinks = (files) =>
  files
    .map((file) => {
      const name = path.basename(file, ".md");
      const htmlFile = name === "README" ? "index.html" : `${name}.html`;

      const displayName = name === "README" ? "Home" : name.replace(/-/g, " ").charAt(0).toUpperCase() + name.slice(1).replace(/-/g, " ");

      return `<li><a href="/${htmlFile}">${displayName}</a></li>`;
    })
    .join("");

fs.removeSync(outputDir);

fs.copySync(staticDir, path.join(outputDir, "static"));

const files = fs.readdirSync(rootDir).filter((file) => path.extname(file) === ".md");

let header = loadTemplate(path.join(rootDir, "site/templates/header.html"));
const footer = loadTemplate(path.join(rootDir, "site/templates/footer.html"));

const navLinks = generateNavLinks(files);
header = header.replace("{{ navLinks }}", navLinks);

files.forEach((file) => {
  const mdContent = fs.readFileSync(file, "utf-8");
  const htmlContent = md.render(mdContent);
  const title = file === "README.md" ? "Home" : path.basename(file, ".md");
  const outputFileName = file === "README.md" ? "index.html" : `${title}.html`;

  const output = template(htmlContent, title, header, footer);
  fs.outputFileSync(path.join(outputDir, outputFileName), output);
});

console.log("Site built with success");
