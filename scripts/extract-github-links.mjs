const res = await fetch("http://localhost:3006/");
const html = await res.text();

const re = /https:\/\/github\.com\/[^"\s<>]+/g;
const links = html.match(re) || [];

console.log("github links found:", links.length);
console.log(links.slice(0, 50).join("\n"));

