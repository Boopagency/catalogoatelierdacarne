// node --experimental-strip-types scripts/check-sheet.ts
import assert from "node:assert";
import { catalogFromRows, checkHeader, money, parseCsv, sheetBase } from "../src/lib/sheet.ts";

assert.deepStrictEqual(parseCsv('a,"b, c","d ""e"""\r\n1,2,3\n'), [["a", "b, c", 'd "e"'], ["1", "2", "3"]]);
assert.strictEqual(money("69,99"), 69.99);
assert.strictEqual(money("69.99"), 69.99);
assert.strictEqual(money("R$ 1.234,50"), 1234.5);
assert.strictEqual(money(""), null);
assert.strictEqual(money("abc"), null);

const base = { settings: {} as never, categories: [], kits: [], live: false };
const c = catalogFromRows(
  base,
  [["Categoria", "Produto", "Preço", "Promoção", "Unidade", "Disponível"],
   ["Bovinos", "Picanha", "110,99", "", "kg", "Sim"],
   ["Bovinos", "Errado", "texto", "", "kg", "Sim"],
   ["Bovinos", "Acabou", "10", "", "kg", "Não"],
   ["Bovinos", "Promo", "50", "40", "un", "Sim"]],
  [["Kit", "Itens", "Preço", "De", "Quarta", "Selo", "Disp"],
   ["Hambúrguer", "a | b", "69,9", "79,9", "Sim", "Toda quarta", "Sim"]],
);
assert.deepStrictEqual(c.categories[0].products.map((p) => [p.name, p.price, p.promo_price, p.unit]), [["Picanha", 110.99, null, "kg"], ["Promo", 50, 40, "un"]]);
assert.deepStrictEqual([c.kits[0].price, c.kits[0].old_price, c.kits[0].promo_quarta, c.kits[0].items], [69.9, 79.9, true, ["a", "b"]]);
assert.throws(() => catalogFromRows(base, [["h"]], []));
const pub = "https://docs.google.com/spreadsheets/d/e/2PACX-abc/pub";
for (const u of [pub, pub + "html", pub + "html?gid=0&single=true", pub + "?output=csv", " " + pub + "/ "]) assert.strictEqual(sheetBase(u), pub);
assert.throws(() => checkHeader(parseCsv("<!DOCTYPE html><html>"), "categoria"));
assert.doesNotThrow(() => checkHeader([["Categoria", "Produto"]], "categoria"));
console.log("ok");
