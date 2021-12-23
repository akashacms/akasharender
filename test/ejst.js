const fs  = require('fs');
const ejs = require('ejs');

const dirs = [
    '/Volumes/Extra/akasharender/akasharender/test/partials',
    '/Volumes/Extra/akasharender/akasharender/partials'
];

const rendered = ejs.render(`
<%- include('helloworld.html') %>
`, {}, {
    views: dirs,
    filename: 'foo.html'
});

console.log(rendered);
