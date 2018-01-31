const fm = require('front-matter');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const md = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true,
});

const slugify = str => str.replace(/\W/g, '-');

// assert(Array.isArray(defaultArticle.slides), 'You dun messed up the markdown parsing');

/**
 * Parses markdown into slides
 * @param  {String} file.path - The path to the file
 * @return {Array}
 */
const transform = (file) => {
  const { attributes, body } = fm(file.contents);
  const sections = body.trimLeft().split(/# \*Part\*/g);

  const articleSections =
    sections
      .map(slide => slide.split(/```__CODESECTION__/))
      .map(([markdown, code]) => {
        if (code == null || code === '') {
          throw new Error('You dun parsed dis wrong or have incorrect markdown');
        }

        return {
          content: md.render(markdown.replace(/^\s*/, '')),
          code: code.replace(/```\s*$/, ''),
        };
      });

  return {
    path: file.path,
    contents: file.contents,
    sections: articleSections,
    meta: attributes,
  };
};

const dirname = path.join(__dirname, '../_posts');

fs.readdir(dirname, async (err, _filenames) => {
  if (err) {
    console.log(err);
  }

  const filenames =
    _filenames.map(filename =>
      path.join(__dirname, '../_posts', filename),
    );

  const files =
    await Promise.all(
      filenames.map(async (filename) => {
        return {
          path: filename,
          contents: await readFile(filename, 'utf8'),
        };
      }),
    );

  const articles = files.map(file => transform(file));

  const articlesMeta = articles.map(article => article.meta);

  await writeFile(
      path.join(__dirname, '../static/posts/meta.json'),
      JSON.stringify(articlesMeta, null, 2),
    );

  articles.map((article) => {
    const basename = `${path.basename(article.path, '.md')}.json`;
    const outputPath = path.join(__dirname, '../static/posts', basename);
    const data = {
      sections: article.sections,
      meta: article.meta,
    };

    return writeFile(outputPath, JSON.stringify(data, null, 2));
  });
});
