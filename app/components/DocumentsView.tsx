import { useMemo, useState } from "react";
import type { DocStatus, DocType, Draft, LineItem, Store, TradeDocument } from "../lib/types";
import {
  blankLine,
  currencies,
  docNames,
  docShort,
  docTotal,
  docTypes,
  incoterms,
  makeNumber,
  money,
} from "../lib/data";
import { DocumentPreview } from "./DocumentPreview";
import { Icon } from "./icons";

const badgeClass = (type: DocType) => "doc-badge t-" + docShort[type].toLowerCase();

export function DocumentsView({
  store,
  draft,
  setDraft,
  onSave,
  onNew,
  onEdit,
  onDelete,
  onConvert,
  onStampMove,
}: {
  store: Store;
  draft: Draft;
  setDraft: (updater: (d: Draft) => Draft) => void;
  onSave: (status: DocStatus) => void;
  onNew: () => void;
  onEdit: (doc: TradeDocument) => void;
  onDelete: (id: string) => void;
  onConvert: (type: DocType) => void;
  onStampMove: (x: number, y: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | DocType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | DocStatus>("all");

  const customer = store.customers.find((x) => x.id === draft.customerId);
  const total = useMemo(() => docTotal(draft.lines), [draft.lines]);
  const savedDoc = draft.id ? store.documents.find((x) => x.id === draft.id) : undefined;
  const isConfirmed = savedDoc?.status === "Confirmed";
  const isPacking = draft.type === "Packing List";

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.documents.filter((doc) => {
      if (typeFilter !== "all" && doc.type !== typeFilter) return false;
      if (statusFilter !== "all" && doc.status !== statusFilter) return false;
      if (!q) return true;
      const company = store.customers.find((x) => x.id === doc.customerId)?.company ?? "";
      return (
        doc.number.toLowerCase().includes(q) ||
        company.toLowerCase().includes(q) ||
        doc.items.some((item) => item.description.toLowerCase().includes(q))
      );
    });
  }, [store.documents, store.customers, query, typeFilter, statusFilter]);

  function update<K extends keyof Draft>(field: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  function changeDocType(type: DocType) {
    if (draft.id) return; // saved documents change type through the conversion flow
    setDraft((d) => ({ ...d, type, number: makeNumber(type, store.documents) }));
  }

  function chooseProduct(lineId: string, productId: string) {
    const product = store.products.find((x) => x.id === productId);
    setDraft((d) => ({
      ...d,
      lines: d.lines.map((line) =>
        line.id === lineId
          ? {
              ...line,
              productId,
              description: product
                ? product.name + (product.specification ? " · " + product.specification : "")
                : "",
              hsCode: product?.hsCode || "",
              unit: product?.unit || "pcs",
              unitPrice: product?.price || 0,
            }
          : line,
      ),
    }));
  }

  function updateLine(lineId: string, field: keyof LineItem, value: string | number) {
    setDraft((d) => ({
      ...d,
      lines: d.lines.map((line) => (line.id === lineId ? { ...line, [field]: value } : line)),
    }));
  }

  function removeLine(lineId: string) {
    setDraft((d) => ({
      ...d,
      lines: d.lines.length > 1 ? d.lines.filter((x) => x.id !== lineId) : d.lines,
    }));
  }

  function removeDocument(doc: TradeDocument) {
    if (window.confirm("确定删除单据 " + doc.number + "？")) onDelete(doc.id);
  }

  const numberField = (line: LineItem, field: keyof LineItem, step = "0.01") => (
    <input
      type="number"
      min="0"
      step={step}
      value={line[field] as number}
      onChange={(e) => updateLine(line.id, field, Number(e.target.value))}
    />
  );

  return (
    <div className="page document-page">
      <div className="document-left no-print">
        <section className="panel composer">
          <div className="panel-head">
            <div>
              <p className="eyebrow">DOCUMENT COMPOSER</p>
              <h3>{draft.id ? "编辑单据" : "单据编辑器"}</h3>
            </div>
            {draft.id ? (
              <button className="text-button" onClick={onNew}>
                完成并新建
              </button>
            ) : (
              <span className="autosave">● 本地存储</span>
            )}
          </div>
          {draft.id && (
            <div className="editing-banner">
              正在编辑已保存的单据 <b>{draft.number}</b>
              {isConfirmed ? "（已确认）" : "（草稿）"}，保存后将覆盖原记录。
            </div>
          )}

          <p className="section-label">单据类型</p>
          <div className="doc-type-tabs">
            {docTypes.map((type) => (
              <button
                key={type}
                className={draft.type === type ? "active" : ""}
                disabled={Boolean(draft.id) && draft.type !== type}
                title={draft.id ? "已保存单据请使用下方「单据流转」转换类型" : undefined}
                onClick={() => changeDocType(type)}
              >
                {docShort[type]}
                <small>{type}</small>
              </button>
            ))}
          </div>

          <p className="section-label">基础信息</p>
          <div className="field-row three">
            <label>
              单据号
              <input value={draft.number} onChange={(e) => update("number", e.target.value)} />
            </label>
            <label>
              日期
              <input type="date" value={draft.date} onChange={(e) => update("date", e.target.value)} />
            </label>
            <label>
              币种
              <select value={draft.currency} onChange={(e) => update("currency", e.target.value)}>
                {currencies.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="field-row customer-row">
            <label>
              客户
              <select value={draft.customerId} onChange={(e) => update("customerId", e.target.value)}>
                <option value="">请选择客户</option>
                {store.customers.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.company}
                  </option>
                ))}
              </select>
            </label>
            <label>
              单据语言
              <select
                value={draft.language}
                onChange={(e) => update("language", e.target.value as Draft["language"])}
              >
                <option value="en">英文</option>
                <option value="bilingual">中英双语</option>
              </select>
            </label>
          </div>

          <p className="section-label">贸易条款</p>
          <div className="field-row three">
            <label>
              贸易术语
              <select value={draft.incoterm} onChange={(e) => update("incoterm", e.target.value)}>
                <option value="">未指定</option>
                {incoterms.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              起运港
              <input
                value={draft.portOfLoading}
                onChange={(e) => update("portOfLoading", e.target.value)}
                placeholder="e.g. Shanghai, China"
              />
            </label>
            <label>
              目的港
              <input
                value={draft.portOfDestination}
                onChange={(e) => update("portOfDestination", e.target.value)}
                placeholder="e.g. Hamburg, Germany"
              />
            </label>
          </div>
          {isPacking && (
            <label>
              唛头（Shipping Marks）
              <textarea
                value={draft.shippingMarks}
                onChange={(e) => update("shippingMarks", e.target.value)}
                placeholder={"N/M or e.g.\nNORTHSTAR\nHAMBURG\nC/NO. 1-20"}
              />
            </label>
          )}

          <p className="section-label">商品明细</p>
          {isPacking ? (
            <div className="line-editor packing">
              {draft.lines.map((line) => (
                <div className="packing-line" key={line.id}>
                  <div className="packing-top">
                    <select value={line.productId} onChange={(e) => chooseProduct(line.id, e.target.value)}>
                      <option value="">自定义项</option>
                      {store.products.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.sku} · {x.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={line.description}
                      onChange={(e) => updateLine(line.id, "description", e.target.value)}
                      placeholder="Description"
                    />
                    <button className="icon-button danger" onClick={() => removeLine(line.id)} aria-label="删除明细行">
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                  <div className="packing-nums">
                    <label>
                      数量
                      {numberField(line, "quantity", "1")}
                    </label>
                    <label>
                      单位
                      <input value={line.unit} onChange={(e) => updateLine(line.id, "unit", e.target.value)} />
                    </label>
                    <label>
                      箱数
                      {numberField(line, "cartons", "1")}
                    </label>
                    <label>
                      净重 kg
                      {numberField(line, "netWeight")}
                    </label>
                    <label>
                      毛重 kg
                      {numberField(line, "grossWeight")}
                    </label>
                    <label>
                      体积 m³
                      {numberField(line, "volume", "0.001")}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="line-editor">
              <div className="line-head">
                <span>商品</span>
                <span>描述</span>
                <span>HS Code</span>
                <span>数量</span>
                <span>单位</span>
                <span>单价</span>
                <span />
              </div>
              {draft.lines.map((line) => (
                <div className="line-row" key={line.id}>
                  <select value={line.productId} onChange={(e) => chooseProduct(line.id, e.target.value)}>
                    <option value="">自定义项</option>
                    {store.products.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.sku} · {x.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={line.description}
                    onChange={(e) => updateLine(line.id, "description", e.target.value)}
                    placeholder="Description"
                  />
                  <input
                    value={line.hsCode}
                    onChange={(e) => updateLine(line.id, "hsCode", e.target.value)}
                    placeholder="HS"
                  />
                  {numberField(line, "quantity", "1")}
                  <input value={line.unit} onChange={(e) => updateLine(line.id, "unit", e.target.value)} />
                  {numberField(line, "unitPrice")}
                  <button className="icon-button danger" onClick={() => removeLine(line.id)} aria-label="删除明细行">
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            className="add-line"
            onClick={() => setDraft((d) => ({ ...d, lines: [...d.lines, blankLine()] }))}
          >
            <Icon name="plus" size={15} />
            添加明细行
          </button>

          <p className="section-label">条款与备注</p>
          {!isPacking && (
            <label>
              付款条款
              <input
                value={draft.paymentTerms}
                onChange={(e) => update("paymentTerms", e.target.value)}
                placeholder="e.g. 30% T/T deposit, balance against B/L copy"
              />
            </label>
          )}
          <label>
            其他条款与备注
            <textarea value={draft.notes} onChange={(e) => update("notes", e.target.value)} />
          </label>

          {!isPacking && (
            <div className="composer-total">
              <span>合计金额</span>
              <b>{money(total, draft.currency)}</b>
            </div>
          )}

          <div className="composer-actions">
            <button className="secondary" onClick={() => onSave("Draft")}>
              {isConfirmed ? "撤回为草稿" : "保存草稿"}
            </button>
            <button className="secondary" onClick={() => window.print()}>
              <Icon name="printer" size={15} />
              打印 / PDF
            </button>
            <button className="primary" onClick={() => onSave("Confirmed")}>
              <Icon name="check" size={15} />
              {isConfirmed ? "保存修改" : "确认单据"}
            </button>
          </div>

          {savedDoc && (
            <div className="flow-box">
              <p className="section-label">单据流转</p>
              <div className="flow-row">
                {docTypes
                  .filter((t) => t !== draft.type)
                  .map((t) => (
                    <button key={t} onClick={() => onConvert(t)}>
                      <Icon name="convert" size={14} />
                      转为{docNames[t]}
                    </button>
                  ))}
              </div>
              <small>以当前单据内容生成新草稿，客户、明细与贸易条款自动带入，保存后生效。</small>
            </div>
          )}
        </section>

        <section className="panel history-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">{filteredDocs.length} / {store.documents.length} RECORDS</p>
              <h3>已保存单据</h3>
            </div>
          </div>
          <div className="history-toolbar">
            <div className="search-box">
              <Icon name="search" size={15} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索单据号 / 客户 / 商品"
              />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as "all" | DocType)}>
              <option value="all">全部类型</option>
              {docTypes.map((t) => (
                <option key={t} value={t}>
                  {docShort[t]} {docNames[t]}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | DocStatus)}>
              <option value="all">全部状态</option>
              <option value="Draft">草稿</option>
              <option value="Confirmed">已确认</option>
            </select>
          </div>
          {filteredDocs.length ? (
            <div className="document-history">
              {filteredDocs.map((doc) => (
                <article key={doc.id} className={draft.id === doc.id ? "editing" : ""}>
                  <span className={badgeClass(doc.type)}>{docShort[doc.type]}</span>
                  <div className="doc-info">
                    <b>{doc.number}</b>
                    <small>
                      {doc.date} · {store.customers.find((x) => x.id === doc.customerId)?.company || "客户已删除"}
                    </small>
                  </div>
                  {doc.type !== "Packing List" && (
                    <b className="amount">{money(docTotal(doc.items), doc.currency)}</b>
                  )}
                  <span className={"tag" + (doc.status === "Confirmed" ? " confirmed" : "")}>
                    {doc.status === "Confirmed" ? "已确认" : "草稿"}
                  </span>
                  <div className="row-actions">
                    <button className="icon-button" onClick={() => onEdit(doc)} aria-label={"编辑 " + doc.number}>
                      <Icon name="edit" size={15} />
                    </button>
                    <button className="icon-button danger" onClick={() => removeDocument(doc)} aria-label={"删除 " + doc.number}>
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state compact">
              <p>{store.documents.length ? "没有符合条件的单据" : "暂无已保存单据"}</p>
            </div>
          )}
        </section>
      </div>

      <DocumentPreview
        type={draft.type}
        number={draft.number}
        date={draft.date}
        seller={store.seller}
        customer={customer}
        currency={draft.currency}
        language={draft.language}
        lines={draft.lines}
        paymentTerms={draft.paymentTerms}
        notes={draft.notes}
        total={total}
        incoterm={draft.incoterm}
        portOfLoading={draft.portOfLoading}
        portOfDestination={draft.portOfDestination}
        shippingMarks={draft.shippingMarks}
        onStampMove={onStampMove}
      />
    </div>
  );
}
