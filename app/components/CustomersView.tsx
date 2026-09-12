import { FormEvent, useState } from "react";
import type { Customer } from "../lib/types";
import { uid } from "../lib/data";
import { Icon } from "./icons";

const emptyForm: Omit<Customer, "id"> = {
  company: "",
  contact: "",
  email: "",
  phone: "",
  country: "",
  address: "",
};

export function CustomersView({
  customers,
  onSave,
  onDelete,
}: {
  customers: Customer[];
  onSave: (item: Customer) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.company.trim()) return;
    onSave({ id: editingId ?? uid(), ...form, company: form.company.trim() });
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(item: Customer) {
    setEditingId(item.id);
    setForm({
      company: item.company,
      contact: item.contact,
      email: item.email,
      phone: item.phone,
      country: item.country,
      address: item.address,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function remove(item: Customer) {
    if (window.confirm("确定删除客户「" + item.company + "」？相关单据会保留。")) onDelete(item.id);
  }

  return (
    <div className="page two-column">
      <form className="panel form-panel" onSubmit={submit}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">CUSTOMER PROFILE</p>
            <h3>{editingId ? "编辑客户" : "新建客户"}</h3>
          </div>
          {editingId && (
            <button type="button" className="text-button" onClick={cancelEdit}>
              取消编辑
            </button>
          )}
        </div>
        <label>
          公司名称
          <input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" />
        </label>
        <div className="field-row">
          <label>
            联系人
            <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          </label>
          <label>
            国家/地区
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </label>
        </div>
        <div className="field-row">
          <label>
            邮箱
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label>
            电话
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
        </div>
        <label>
          地址
          <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </label>
        <button className="primary wide">{editingId ? "保存修改" : "保存客户"}</button>
      </form>

      <section className="panel list-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">{customers.length} RECORDS</p>
            <h3>客户列表</h3>
          </div>
        </div>
        {customers.length ? (
          <div className="card-list">
            {customers.map((item) => (
              <article key={item.id} className={editingId === item.id ? "editing" : ""}>
                <span className="avatar">{item.company.slice(0, 2).toUpperCase()}</span>
                <div className="card-main">
                  <b>{item.company}</b>
                  <p>
                    {item.contact || "未填写联系人"} · {item.country || "未填写国家"}
                  </p>
                  <small>{item.email || item.phone || "暂无联系方式"}</small>
                </div>
                <div className="row-actions">
                  <button className="icon-button" onClick={() => startEdit(item)} aria-label={"编辑 " + item.company}>
                    <Icon name="edit" size={15} />
                  </button>
                  <button className="icon-button danger" onClick={() => remove(item)} aria-label={"删除 " + item.company}>
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state compact">
            <p>暂无客户，请先在左侧新建。</p>
          </div>
        )}
      </section>
    </div>
  );
}
