const Koa = require('koa');
const Router = require("koa-router");
const serve = require("koa-static");
const mount = require("koa-mount");
// const Logger = require("koa-logger");

const PORT = process.env.PORT || 3000;

const app = new Koa();
const static_pages = new Koa();
const router = new Router();

console.log(__dirname)
static_pages.use(serve(__dirname + "/../../build")); //serve the build directory
app.use(mount("/", static_pages));

router.get("/book",async (ctx,next)=>{
    const books = ["Speaking javascript", "Fluent Python", "Pro Python", "The Go programming language"];
    ctx.body = books;
    await next();
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT, function () {
    console.log("==> 🌎  Listening on port %s. Visit http://localhost:%s/", PORT, PORT);
});
