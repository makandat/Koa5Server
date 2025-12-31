/* Ai 画像管理 v1.0 */
'use strict'
import Koa from 'koa'
import koaBodyImport from 'koa-body'
import session from 'koa-session'
import Router from '@koa/router'
import KoaLogger from 'koa-logger'
import serve from 'koa-static'
import views from 'koa-views'
import path from 'path'
import fs from 'fs'
import AiPictures from './AiPictures.js'

// JSON ファイルを読む。
function read_json(filepath) {
  let data = null
  try {
    const jsonString = fs.readFileSync(filepath, 'utf8')
    data = JSON.parse(jsonString)
  }
  catch (err) {
    console.error('Error reading or parsing JSON file:', err)
  }
  return data
}

// コードから Model タイプを得る。
function get_model_type(code) {
  let model_type = ''
  const codeNum = Number(code)
  switch (codeNum) {
    case 1:
      model_type = 'SD1.5'
      break
    case 2:
      model_type = 'SDXL'
      break
    default:
      model_type = 'Unknown'
      break
  }
  return model_type
}

// パス名が " で囲まれていたらそれらを取り除く。
function remove_paren(path) {
  let newpath = path
  if (path.startsWith('"') && path.endsWith('"')) {
    newpath = path.slice(1, -1)
  }
  return newpath
}


// Koa アプリケーションの初期化
const PORT = 3430  // 必要ならポート番号を変更すること。
const DBPATH = './aipictures.db'
const config = read_json('./package.json')
const Title = "AI 生成画像管理 ver." + config.version
// Koa アプリケーションの初期化
const app = new Koa()
app.keys = ['koa_server_key']
// セッションの使用
app.use(session(app))
// ルータの使用
const router = new Router()
// ロガーの使用
app.use(KoaLogger())
// ビューファイルのディレクトリと使用するテンプレートエンジンを設定
app.use(views(path.join(path.dirname("."), 'views'), {
  extension: 'ejs'
}))
// ボディパーサを使用
const KoaBody = koaBodyImport.default || koaBodyImport
app.use(KoaBody())
// データベースの初期化
const db = new AiPictures(DBPATH)

// ルートハンドラ
router.get('/', async ctx => {
  let message = ''
  let data = []
  if (ctx.session.values == undefined) {
    // セッション変数がないとき
    ctx.session.values = {view:'list', mark:'', filter:'', order:'ASC', offset:0}
  }
  else {
    ctx.session.values.view = 'list'
  }
  const state = `{view:"${ctx.session.values.view}", mark:"${ctx.session.values.mark}", filter:"${ctx.session.values.filter}", order:"${ctx.session.values.order}", offset:${ctx.session.values.offset}}`
  if (ctx.request.query.order != undefined) {
    // 並び順が変更されたとき
    ctx.session.values.order = ctx.request.query.order
    data = await db.query_mark(ctx.session.values.mark, ctx.request.query.order, ctx.session.values.offset)
    let order_text = '昇順'
    if (ctx.request.query.order.toUpperCase() == 'DESC')
      order_text = '降順'
    message = `並び順を ${order_text} に変更しました。` + state
  }
  else if (ctx.request.query.offset != undefined) {
    ctx.session.values.offset = ctx.request.query.offset
    data = await db.query_mark(ctx.session.values.mark, ctx.request.query.order, ctx.session.values.offset) 
  }
  else if (ctx.request.query.mark != undefined) {
    // marks セレクタが変更されたとき
    ctx.session.values.mark = ctx.request.query.mark
    data = await db.query_mark(ctx.request.query.mark, ctx.session.values.order, ctx.session.values.offset)
    if (data.length > 0) {
      message = `${data.length} 件のデータが見つかりました。` + state
    }
    else {
      message = 'データがありません。'
    }
  }
  else if (ctx.request.query.filter != undefined) {
    // 「検索」ボタンが押されたとき
    ctx.session.values.filter = ctx.request.query.filter
    data = await db.query_word(ctx.request.query.filter)
    if (data.length > 0) {
      message = `${data.length} 件のデータが見つかりました。` + state
    }
    else {
      message = 'データがありません。'
    }
  }
  else if (ctx.request.query.fav != undefined) {
    // 「お気に入り」メニューが押されたとき
    ctx.session.values.mark = ''
    data = await db.query_fav(ctx.session.values.order, ctx.session.values.offset)
    if (data.length > 0) {
      message = `${data.length} 件のデータが見つかりました。` + state
    }
    else {
      message = 'データがありません。'
    }
  }
  else {
    data = await db.query('SELECT * FROM pictures ORDER BY id ' + ctx.session.values.order)
    if (data.length > 0) {
      message = `${data.length} 件のデータが見つかりました。` + state
    }
    else {
      message = 'データがありません。'
    }
  }
  // コードを名前に変換する。
  for (const item of data) {
    let name = await db.get_site_name(item.site)
    if (name != null)
      item.site = name
    name = await db.get_checkpoint_name(item.checkpoint)
    if (name != null)
      item.checkpoint = name
  }
  // ウェブページを返す。
  await ctx.render('index', {view:ctx.session.values.view, title:Title, message:message, data:data})
})

/* ビューの変更 */
router.get('/view', async ctx => {
  let message = ''
  if (ctx.session.values.view == 'list') {
    ctx.session.values.view = 'thumbs'
  }
  else {
    ctx.session.values.view = 'list'
  }
  const state = `{view:${ctx.session.values.view}, mark:${ctx.session.values.mark}, filter:${ctx.session.values.filter}, order:${ctx.session.values.order}, offset:${ctx.session.values.offset}}`
  const data = await db.query('SELECT * FROM pictures ORDER BY id ' + ctx.session.values.order)
  if (data.length > 0) {
    message = `${data.length} 件のデータが見つかりました。` + state
  }
  else {
    message = 'データがありません。'
  }
  await ctx.render('index', {view:ctx.session.values.view, title:Title, message:message, data:data})
})

// データの追加
router.get('/insert', async ctx => {
  const data = {
    id: '',
    title: '',
    path: '',
    site: '',
    checkpoint: '',
    lora: '',
    vae: '',
    prompt: '',
    neg_prompt: '',
    mark: '',
    fav: '0',
    info: ''
  }
  await ctx.render('insert', {message:'', data:data})
})
router.post('/insert', async ctx => {
  let message = ''
  // パスが存在するかチェック
  const filepath = remove_paren(ctx.request.body.path)
  if (!fs.existsSync(filepath)) {
    message = `エラー: 画像ファイルが見つかりません。パス: ${filepath}`
  }
  // パスが登録済みかチェック
  else if (await db.check_path_exists(filepath)) {
    message = `エラー: 同じパスのデータが既に登録されています。パス: ${filepath}`
  }
  let data = {
    id: '',
    title: ctx.request.body.title,
    path: filepath,
    site: ctx.request.body.site,
    checkpoint: ctx.request.body.checkpoint,
    lora: ctx.request.body.lora,
    vae: ctx.request.body.vae,
    prompt: ctx.request.body.prompt,
    neg_prompt: ctx.request.body.neg_prompt,
    mark: ctx.request.body.mark,
    fav: ctx.request.body.fav,
    info: ctx.request.body.info
  }
  if (message == '') {
    const dnew = await db.insert(data)
    message = `id = ${dnew.lastInsertRowid} のデータが追加されました。`
  }
  await ctx.render('insert', {message:message, data:data})
})

// データの更新
router.get('/update/:id', async ctx => {
  const id = ctx.params.id
  const row = await db.get_id(id)
  let data = {
    id: id,
    title: row.title,
    path: row.path,
    site: row.site,
    checkpoint: row.checkpoint,
    lora: row.lora,
    vae: row.vae,
    prompt: row.prompt,
    neg_prompt: row.neg_prompt,
    mark: row.mark,
    fav: row.fav,
    info: row.info
  }
  await ctx.render('update', {message:'', data:data})
})
router.post('/update/:id', async ctx => {
  let message = ''
  const row = ctx.request.body
  const id = row.id
  // パスが存在するかチェック
  const filepath = row.path
  if (!fs.existsSync(filepath)) {
    message = `エラー: 画像ファイルが見つかりません。パス: ${filepath}`
  }
  let data = {
    id: id,
    title: row.title,
    path: remove_paren(row.path),
    site: row.site,
    checkpoint: row.checkpoint,
    lora: row.lora,
    vae: row.vae,
    prompt: row.prompt,
    neg_prompt: row.neg_prompt,
    mark: row.mark,
    fav: row.fav,
    info: row.info
  }
  if (message == '') {
    await db.update(id, data)
    message = `id = ${id} のデータが更新されました。`
  }
  await ctx.render('update', {message:message, data:data})
})

// Site ページを開く
router.get('/site', async ctx => {
  let message = ""
  let data = {
    id: '',
    name: '',
    info: ''
  }
  const content = await db.query_site()
  await ctx.render('site', {message:message, data:data, content:content})  
})
router.post('/site', async ctx => {
  let message = ""
  let data = {
    id: ctx.request.body.id,
    name: ctx.request.body.name,
    info: ctx.request.body.info
  }
  if (data.id != '') {
    await db.update_site(data)
    message = `id = ${data.id} のデータが更新されました。`
  }
  else {
    const dnew = await db.insert_site(data)
    message = `id = ${dnew.lastInsertRowid} のデータが追加されました。`
  }
  const content = await db.query_site()
  await ctx.render('site', {message:message, data:data, content:content})  
})

// Checkpoint ページを開く
router.get('/checkpoint', async ctx => {
  let message = ""
  const data = {
    id: '',
    name: '',
    type: '',
    info: ''
  }
  const content = await db.query_checkpoint()
  await ctx.render('checkpoint', {message:message, data:data, content:content})
})
router.post('/checkpoint', async ctx => {
  let message = ""
  let data = {
    id: ctx.request.body.id,
    name: ctx.request.body.name,
    type: get_model_type(ctx.request.body.type),
    info: ctx.request.body.info
  }
  if (data.id != '') {
    await db.update_checkpoint(data)
    message = `id = ${data.id} のデータが更新されました。`
  }
  else {
    const dnew = await db.insert_checkpoint(data)
    message = `id = ${dnew.lastInsertRowid} のデータが追加されました。`
  }
  const content = await db.query_checkpoint()
  await ctx.render('checkpoint', {message:message, data:data, content:content})
})

// LoRA ページを開く
router.get('/lora', async ctx => {
  let message = ""
  const data = {
    id: '',
    name: '',
    type: '',
    info: ''
  }
  const content = await db.query_lora()
  await ctx.render('lora', {message:message, data:data, content:content})
})
router.post('/lora', async ctx => {
  let message = ""
  let data = {
    id: ctx.request.body.id,
    name: ctx.request.body.name,
    type: get_model_type(ctx.request.body.type),
    info: ctx.request.body.info
  }
  if (data.id != '') {
    await db.update_lora(data)
    message = `id = ${data.id} のデータが更新されました。`
  }
  else {
    const dnew = await db.insert_lora(data)
    message = `id = ${dnew.lastInsertRowid} のデータが追加されました。`
  }
  const content = await db.query_lora()
  await ctx.render('lora', {message:message, data:data, content:content})  
})

// VAE ページを開く
router.get('/vae', async ctx => {
  let message = ""
  const data = {
    id: '',
    name: '',
    type: '',
    info: ''
  }
  const content = await db.query_vae()
  await ctx.render('vae', {message:message, data:data, content:content})
})
router.post('/vae', async ctx => {
  let message = ""
  let data = {
    id: ctx.request.body.id,
    name: ctx.request.body.name,
    type: get_model_type(ctx.request.body.type),
    info: ctx.request.body.info
  }
  if (data.id != '') {
    await db.update_vae(data)
    message = `id = ${data.id} のデータが更新されました。`
  }
  else {
    const dnew = await db.insert_vae(data)
    message = `id = ${dnew.lastInsertRowid} のデータが追加されました。`
  }
  const content = await db.query_vae()
  await ctx.render('vae', {message:message, data:data, content:content})    
})

// 画像表示ページを開く
router.get('/show/:id', async ctx => {
  const id = ctx.params.id
  const data = await db.get_id(id)
  const title = `(${id}) ${data.title}`
  const names = {}
  names.site = await db.get_site_name(data.site)
  names.checkpoint = await db.get_checkpoint_name(data.checkpoint)
  names.lora = await db.get_lora_name(data.lora)
  names.vae = await db.get_vae_name(data.vae)
  await ctx.render('show', {title:title, data:data, names:names})
})

// 画像を返す。
router.get('/image', async (ctx) => {
  const imagePath = ctx.query.path;
  if (!imagePath || !fs.existsSync(imagePath)) {
    ctx.status = 404;
    ctx.body = '画像が見つかりません';
    return;
  }
  ctx.type = path.extname(imagePath); // 拡張子からMIMEタイプを自動設定
  ctx.body = fs.createReadStream(imagePath);
})

// mark 一覧を返す。
router.get('/marks', async ctx => {
  const marks = await db.list_marks()
  ctx.body = JSON.stringify(marks)
})

/* id から site 名を得る */
router.get('/site/:id', async ctx => {
  const id = ctx.params.id
  const name = await db.get_site_name(id)
  ctx.body = name
})

/* id から checkpoint 名を得る */
router.get('/checkpoint/:id', async ctx => {
  const id = ctx.params.id
  const name = await db.get_checkpoint_name(id)
  ctx.body = name
})

/* id から lora 名を得る */
router.get('/lora/:id', async ctx => {
  const id = ctx.params.id
  const name = await db.get_lora_name(id)
  ctx.body = name
})

/* id から vae 名を得る */
router.get('/vae/:id', async ctx => {
  const id = ctx.params.id
  const name = await db.get_vae_name(id)
  ctx.body = name
})


/*  START */
// アプリケーションにルートを適用する。
app.use(router.routes()).use(router.allowedMethods())

// 'public'ディレクトリ内のファイルを静的ファイルとして公開
app.use(serve(path.join(path.dirname("."), 'public')))

// サーバーの起動
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

  