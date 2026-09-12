import { FormEvent, useState } from "react";
import type { Product } from "../lib/types";
import { money, uid } from "../lib/data";
import { Icon } from "./icons";

const emptyForm: Omit<Product, "id"> = {
  sku: "",
  name: "",
  specification: "",
  price: 0,
  unit: "pcs",
  hsCode: "",
};

export function ProductsView({
  products,
  onSave,
  onDelete,
}: {
  products: Product[];
  onSave: (item: Product) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? products.filter(
        (x) =>
          x.sku.toLowerCase().includes(q) ||
          x.name.toLowerCase().includes(q) ||
          x.specification.toLowerCase().includes(q) ||
          x.hsCode.toLowerCase().includes(q),
      )
    : products;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    onSave({ id: editingId ?? uid(), ...form, name: form.name.trim(), price: Number(form.price) || 0 });
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(item: Product) {
    setEditingId(item.id);
    setForm({
      sku: item.sku,
      name: item.name,
      specification: item.specification,
      price: item.price,
      unit: item.unit,
      hsCode: item.hsCode,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function remove(item: Product) {
    if (window.confirm("确定删除商品「" + item.name + "」？")) onDelete(item.id);
  }

  return (
    <div className="page two-column">
      <form className="panel form-panel" onSubmit={submit}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">PRODUCT MASTER</p>
            <h3>{editingId ? "编辑商品" : "新建商品"}</h3>
          </div>
          {editingId && (
            <button type="button" className="text-button" onClick={cancelEdit}>
              取消编辑
            </button>
          )}
        </div>
        <div className="field-row">
          <label>
            SKU
            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </label>
          <label>
            HS Code
            <input value={form.hsCode} onChange={(e) => setForm({ ...form, hsCode: e.target.value })} />
          </label>
        </div>
        <label>
          商品名称
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label>
          规格描述
          <textarea value={form.specification} onChange={(e) => setForm({ ...form, specification: e.target.value })} />
        </label>
        <div className="field-row">
          <label>
            参考单价
            <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          </label>
          <label>
            单位
            <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </label>
        </div>
        <button className="primary wide">{editingId ? "保存修改" : "保存商品"}</button>
      </form>

      <section className="panel list-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">{filtered.length} / {products.length} RECORDS</p>
            <h3>商品列表</h3>
          </div>
          <div className="search-box">
            <Icon name="search" size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索 SKU / 名称 / 规格" />
          </div>
        </div>
        {filtered.length ? (
          <div className="product-table">
            <div className="table-head">
              <span>SKU / 商品</span>
              <span>规格</span>
              <span>价格</span>
              <span />
            </div>
            {filtered.map((item) => (
              <div className={"table-row" + (editingId === item.id ? " editing" : "")} key={item.id}>
                <span>
                  <b>{item.sku || "NO SKU"}</b>
                  <small>{item.name}</small>
                </span>
                <span className="spec">{item.specification || "—"}</span>
                <span>
                  <b>{money(item.price)}</b>
                  <small>/ {item.unit}</small>
                </span>
                <div className="row-actions">
                  <button className="icon-button" onClick={() => startEdit(item)} aria-label={"编辑 " + item.name}>
                    <Icon name="edit" size={15} />
                  </button>
                  <button className="icon-button danger" onClick={() => remove(item)} aria-label={"删除 " + item.name}>
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state compact">
            <p>{products.length ? "没有匹配的商品" : "暂无商品，请先在左侧新建。"}</p>
          </div>
        )}
      </section>
    </div>
  );
}
