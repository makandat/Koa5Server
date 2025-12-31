CREATE TABLE pictures (
  id integer primary key autoincrement,
  title text not null,
  [path] text not null unique,
  site integer default 0,
  [checkpoint] integer default 0,
  lora integer default 0,
  vae integer default 0,
  prompt text default '',
  neg_prompt text default '',
  mark text not null default '',
  fav integer not null default 0,
  info text,
  [date] date not null
);

CREATE TABLE site (
  id integer primary key autoincrement,
  name text not null unique,
  info text,
  [date] date not null
);

CREATE TABLE checkpoint (
  id integer primary key autoincrement,
  name text not null unique,
  [type] text,
  info text,
  [date] date not null
);

CREATE TABLE lora (
  id integer primary key autoincrement,
  name text not null unique,
  [type] text,
  info text,
  [date] date not null
);

CREATE TABLE vae (
  id integer primary key autoincrement,
  name text not null unique,
  [type] text,
  info text,
  [date] date not null
);

