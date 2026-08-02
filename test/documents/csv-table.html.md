---
layout: default.html.ejs
title: CSV Table
publicationDate: 2021-11-01
---

Default CSV, header row, default before/after partials:

<div id="csv-default">
<csv-table file-name="csvdata/people.csv" template="csvtable-row.html.njk"></csv-table>
</div>

TSV file:

<div id="tsv-default">
<csv-table file-name="csvdata/people.tsv" template="csvtable-row.html.njk"></csv-table>
</div>

YAML file:

<div id="yaml-default">
<csv-table file-name="csvdata/people.yaml" template="csvtable-row.html.njk"></csv-table>
</div>

Custom before/after templates:

<div id="csv-custom">
<csv-table file-name="csvdata/people.csv" template="csvtable-row.html.njk"
    before-template="csvtable-before-custom.html.njk"
    after-template="csvtable-after-custom.html.njk"></csv-table>
</div>

Special characters (escaping):

<div id="csv-special">
<csv-table file-name="csvdata/special.csv" template="csvtable-row-fields.html.njk"></csv-table>
</div>

External data file outside the project directories, resolved against configDir:

<div id="csv-external">
<csv-table file-name="fixtures/csvtable-external.csv" template="csvtable-row.html.njk"></csv-table>
</div>
