/* AI Generated Pictures Database */
'use strict'
import Database from 'better-sqlite3' // https://www.npmjs.com/package/better-sqlite3
import path from 'path'

export default class AiPictures {
  // コンストラクタ
  // dbpath はデータベースファイルのパス名
  constructor(dbpath) {
    this.db = new Database(dbpath);
  }

  // 結果を返す SQL クエリを実行する
  async query(sql, params = []) {
    return this.db.prepare(sql).all(params)
  }

  // 結果セットを返さない SQL クエリを実行する
  async execute(sql, params = []) {
    const stmt = this.db.prepare(sql)
    return stmt.run(params)
  }

  // 単一の値を返す SQL クエリを実行する
  async get_value(sql, params = []) {
    return this.db.prepare(sql).get(params)
  }

  // pictures に新しいデータを挿入する。
  async insert(data) {
    const sql = 'INSERT INTO pictures (title, path, site, checkpoint, lora, vae, prompt, neg_prompt, mark, fav, info, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date())'
    return this.execute(sql, [data.title, data.path, data.site, data.checkpoint, data.lora, data.vae, data.prompt, data.neg_prompt, data.mark, data.fav, data.info])
  }

  // pictures にデータを更新する。
  async update(id, data) {
    const sql = 'UPDATE pictures SET title=?, path=?, site=?, checkpoint=?, lora=?, vae=?, prompt=?, neg_prompt=?, mark=?, fav=?, info=? WHERE id = ?'
    return this.execute(sql, [data.title, data.path, data.site, data.checkpoint, data.lora, data.vae, data.prompt, data.neg_prompt, data.mark, data.fav, data.info, data.id])
  }

  // pictures の指定した id のデータを削除する。
  async delete(id) {
    const sql = 'DELETE FROM pictures WHERE id = ?';
    return this.execute(sql, [id])
  }

  /* id で指定したデータを得る。*/
  async get_id(id) {
    const sql = 'SELECT * FROM pictures WHERE id = ?'
    return this.db.prepare(sql).get([id])
  }

  /* mark で指定したデータを得る。*/
  async query_mark(mark, order="ASC", offset=0, limit=1000) {
    let sql = 'SELECT * FROM pictures'
    if (mark) {
      sql += " WHERE mark = ?"
    }
    if (order) {
      sql += ` ORDER BY id ${order}`
    }
    sql += ` LIMIT ${limit} OFFSET ${offset}`
    if (mark == '')
      return this.query(sql, [])
    else
      return this.query(sql, [mark])
  }

  /* fav 一覧を取得する。*/
  async query_fav(order="ASC", offset=0, limit=1000) {
    let sql = `SELECT * FROM pictures WHERE fav > 0`
    if (order) {
      sql += ` ORDER BY id ${order}`
    }
    sql += ` LIMIT ${limit} OFFSET ${offset}`
    return this.query(sql, [])
  }

  /* mark 一覧を取得する。*/
  async list_marks() {
    const sql = "SELECT DISTINCT mark FROM pictures"
    const rows = await this.query(sql)
    let marks = []
    for (const item of rows) {
      marks.push(item.mark)
    }
    return marks
  }

  /* フォルダ一覧を得る。*/
  async list_folders() {
    let folders = new Set()
    let sql = "SELECT [path] FROM pictures"
    const paths = await this.query(sql, [])
    for (const p of paths) {
      const folder = path.dirname(p)
      folders.add(folder)
    }
    return folders
  }

  /* ワードで検索する。*/
  async query_word(word) {
    let sql = "SELECT * FROM pictures WHERE instr(info, ?) OR instr(title, ?) OR instr(path, ?)"
    return this.query(sql, [word, word, word])
  }

  /* Site 一覧を取得する */
  async query_site(order='id') {
    let sql = "SELECT * FROM site ORDER BY ?"
    return this.query(sql, [order])
  }
  /* Site を追加する。*/
  async insert_site(data) {
    let sql = "INSERT INTO site(id, name, info, date) VALUES(NULL, ?, ?, date())"
    return this.execute(sql, [data.name, data.info])
  }
  /* Site を更新する。*/
  async update_site(data) {
    let sql = "UPDATE site SET name=?, info=? WHERE id=?"
    return this.execute(sql, [data.name, data.info, data.id])
  }
  /* Site 名を得る。*/
  async get_site_name(id) {
    let sql = "SELECT name FROM site WHERE id = ?"
    const row = this.db.prepare(sql).get([id])
    if (row) {
      return row.name
    }
    else {
      return null
    }
  }

  /* pictures テーブルに登録されている Checkpoint 名一覧を得る。*/
  async list_checkpoint() {
    let sql = "SELECT DISTINCT checkpoint FROM pictures"
    return await this.query(sql, [])
  }
  /* Checkpoint データ一覧を取得する */
  async query_checkpoint(order='id') {
    let sql = "SELECT * FROM checkpoint ORDER BY ?"
    return this.query(sql, [order])
  }
  /* Checkpoint を追加する */
  async insert_checkpoint(data) {
    let sql = "INSERT INTO checkpoint(id, name, type, info, date) VALUES(NULL, ?, ?, ?, date())"
    return this.execute(sql, [data.name, data.type, data.info])
  }
  /* Checkpoint を更新する */
  async update_checkpoint(data) {
    let sql = "UPDATE checkpoint SET name=?, type=?, info=? WHERE id=?"
    return this.execute(sql, [data.name, data.type, data.info, data.id])
  }
  /* Checkpoint 名を得る。*/
  async get_checkpoint_name(id) {
    let sql = "SELECT name FROM checkpoint WHERE id = ?"
    const row = this.db.prepare(sql).get([id])
    if (row) {
      return row.name
    } else {
      return null
    }
  }

  /* LoRA 一覧を取得する */
  async query_lora(order='id') {
    let sql = "SELECT * FROM lora ORDER BY ?"
    return this.query(sql, [order])
  }
  /* LoRA を追加する */
  async insert_lora(data) {
    let sql = "INSERT INTO lora(id, name, type, info, date) VALUES(NULL, ?, ?, ?, date())"
    return this.execute(sql, [data.name, data.type, data.info])
  }
  /* LoRA を更新する */
  async update_lora(data) {
    let sql = "UPDATE lora SET name=?, type=?, info=? WHERE id=?"
    return this.execute(sql, [data.name, data.type, data.info, data.id])
  }
  /* LoRA 名を得る。*/
  async get_lora_name(id) {
    let sql = "SELECT name FROM lora WHERE id = ?"
    const row = this.db.prepare(sql).get([id])
    if (row) {
      return row.name
    } else {
      return null
    }
  }


  /* VAE 一覧を取得する */
  async query_vae(order='id') {
    let sql = "SELECT * FROM vae ORDER BY ?"
    return this.query(sql, [order])
  }
  /* VAE を追加する */
  async insert_vae(data) {
    let sql = "INSERT INTO vae(id, name, type, info, date) VALUES(NULL, ?, ?, ?, date())"
    return this.execute(sql, [data.name, data.type, data.info])
  }
  /* VAE を更新する */
  async update_vae(data) {
    let sql = "UPDATE vae SET name=?, type=?, info=? WHERE id=?"
    return this.execute(sql, [data.name, data.type, data.info, data.id])    
  }
  /* VAE 名を得る。*/
  async get_vae_name(id) {
    let sql = "SELECT name FROM vae WHERE id = ?"
    const row = this.db.prepare(sql).get([id])
    if (row) {
      return row.name
    } else {
      return null
    }
  }

  /* 画像のパスが登録済みかチェックする。*/
  async check_path_exists(path) {
    let sql = "SELECT COUNT(*) AS cnt FROM pictures WHERE path=?"
    const result = await this.get_value(sql, [path])
    const exists = result > 0
    return exists
  }
}
