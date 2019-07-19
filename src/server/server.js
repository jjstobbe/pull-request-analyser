const Koa = require('koa');
const Router = require("koa-router");
const serve = require("koa-static");
const mount = require("koa-mount");
const bodyParser = require('koa-bodyparser');
const AnalysisJob = require('./AnalysisJob')
// const Logger = require("koa-logger");

const PORT = process.env.PORT || 3000;

const app = new Koa();
const static_pages = new Koa();
const router = new Router();

app.use(bodyParser());
static_pages.use(serve(__dirname + "/../../build")); //serve the build directory
app.use(mount("/", static_pages));

router.post("/analyze-pr", async (ctx,next) => {
    if (!ctx.request.body || !ctx.request.body.pullRequest) {
        ctx.throw(400, 'Must have \"pullRequest\" in the request body')
    }

    console.log("Running Job..")
    const response = await AnalysisJob.RunAnalysisJob(ctx.request.body.pullRequest);
    
    ctx.body = response
    await next();
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT, function () {
    console.log("==> 🌎  Listening on port %s. Visit http://localhost:%s/", PORT, PORT);
});
