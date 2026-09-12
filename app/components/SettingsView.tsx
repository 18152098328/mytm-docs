import { FormEvent, useState } from "react";
import type { Seller } from "../lib/types";

export function SettingsView({
  seller,
  onSave,
}: {
  seller: Seller;
  onSave: (seller: Seller) => void;
}) {
  const [form, setForm] = useState<Seller>(seller);

  const set = <K extends keyof Seller>(field: K, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.company.trim()) return;
    onSave({ ...form, company: form.company.trim() });
  }

  return (
    <div className="page settings-page">
      <form className="panel form-panel" onSubmit={submit}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">SELLER PROFILE</p>
            <h3>公司信息</h3>
          </div>
        </div>
        <p className="section-hint">
          这些信息会出现在每份单据的信头、ISSUED BY 与页脚。全部可手工填写。
        </p>
        <label>
          公司名称（英文）
          <input required value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Company name" />
        </label>
        <label>
          地址
          <textarea value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, City, Country" />
        </label>
        <div className="field-row">
          <label>
            电话
            <input value={form.tel} onChange={(e) => set("tel", e.target.value)} />
          </label>
          <label>
            邮箱
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </label>
        </div>
        <label>
          税号 / 统一社会信用代码
          <input value={form.taxId} onChange={(e) => set("taxId", e.target.value)} />
        </label>

        <div className="panel-head inner">
          <div>
            <p className="eyebrow">BANK DETAILS</p>
            <h3>银行收款信息</h3>
          </div>
        </div>
        <p className="section-hint">
          填写后会显示在报价单、形式发票、销售合同和商业发票的 BANK DETAILS 区域，装箱单不显示。
        </p>
        <label>
          开户银行
          <input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} placeholder="Bank name" />
        </label>
        <div className="field-row">
          <label>
            账号
            <input value={form.bankAccount} onChange={(e) => set("bankAccount", e.target.value)} placeholder="Account No." />
          </label>
          <label>
            SWIFT
            <input value={form.bankSwift} onChange={(e) => set("bankSwift", e.target.value)} placeholder="SWIFT / BIC" />
          </label>
        </div>
        <label>
          银行地址
          <textarea value={form.bankAddress} onChange={(e) => set("bankAddress", e.target.value)} />
        </label>
        <button className="primary wide">保存公司信息</button>
      </form>

      <section className="panel settings-preview">
        <div className="panel-head">
          <div>
            <p className="eyebrow">LETTERHEAD PREVIEW</p>
            <h3>信头效果</h3>
          </div>
        </div>
        <div className="letterhead-sample">
          <div className="doc-letterhead">
            <div className="doc-brand">
              <img src="/mytm-logo.png" alt="" />
              <div>
                <b>{form.company || "Company"}</b>
                <span>{form.address || "地址未填写"}</span>
              </div>
            </div>
            <div className="doc-contact">
              {form.tel && <span>Tel: {form.tel}</span>}
              {form.email && <span>{form.email}</span>}
              {form.taxId && <span>Tax ID: {form.taxId}</span>}
            </div>
          </div>
          {(form.bankName || form.bankAccount) && (
            <div className="doc-bank">
              <small>BANK DETAILS</small>
              <p>
                {form.bankName && <>Bank: {form.bankName}<br /></>}
                {form.bankAccount && <>Account No.: {form.bankAccount}<br /></>}
                {form.bankSwift && <>SWIFT: {form.bankSwift}<br /></>}
                {form.bankAddress && <>Bank Address: {form.bankAddress}</>}
              </p>
            </div>
          )}
        </div>
        <div className="settings-tips">
          <p>提示</p>
          <ul>
            <li>贸易术语、起运港、目的港与唛头在单据编辑器中按单填写。</li>
            <li>金额大写（SAY TOTAL …）会根据单据金额与币种自动生成。</li>
            <li>公司信息随备份一起导出与恢复。</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
