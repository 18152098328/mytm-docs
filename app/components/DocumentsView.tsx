import { useMemo } from "react";
import type { DocStatus, DocType, Draft, LineItem, Store, TradeDocument } from "../lib/types";
import { blankLine, currencies, docShort, docTotal, docTypes, makeNumber, money } from "../lib/data";
import { DocumentPreview } from "./DocumentPreview";
import { Icon } from "./icons";

export function DocumentsView({
  store,
  draft,
  setDraft,
  onSave,
  onNew,
  onEdit,
  onDelete,
}: {
  store: Store;
  draft: Draft;
  setDraft: (updater: (d: Draft) => Draft) => void;
  onSave: (status: DocStatus) => void;
  onNew: () => void;
  onEdit: (doc: TradeDocument) => void;
  onDelete: (id: string) => void;
}) {
  const customer = store.customers.find((x) => x.id === draft.customerId);
  const total = useMemo(() => docTotal(draft.lines), [draft.lines]);

  function update<K extends keyof Draft>(field: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  function changeDocType(type: DocType) {
    setDraft((d) => ({
      ...d,
      type,
      number: d.id ? d.number : makeNumber(type, store.documents),
    }));
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
              正在编辑已保存的单据 <b>{draft.number}</b>，保存后将覆盖原记录。
            </div>
          )}

          <div className="doc-type-tabs">
            {docTypes.map((type) => (
              <button
                key={type}
                className={draft.type === type ? "active" : ""}
                onClick={() => changeDocType(type)}
              >
                {docShort[type]}
                <small>{type}</small>
              </button>
            ))}
          </div>

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

          <div className="line-editor">
            <div className="line-head">
              <span>商品</span>
              <span>描述</span>
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
                  type="number"
                  min="0"
                  value={line.quantity}
                  onChange={(e) => updateLine(line.id, "quantity", Number(e.target.value))}
                />
                <input value={line.unit} onChange={(e) => updateLine(line.id, "unit", e.target.value)} />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.unitPrice}
                  onChange={(e) => updateLine(line.id, "unitPrice", Number(e.target.value))}
                />
                <button className="icon-button danger" onClick={() => removeLine(line.id)} aria-label="删除明细行">
                  <Icon name="close" size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            className="add-line"
            onClick={() => setDraft((d) => ({ ...d, lines: [...d.lines, blankLine()] }))}
          >
            <Icon name="plus" size={15} />
            添加明细行
          </button>

          <label>
            条款与备注
            <textarea value={draft.notes} onChange={(e) => update("notes", e.target.value)} />
          </label>

          <div className="composer-total">
            <span>合计金额</span>
            <b>{money(total, draft.currency)}</b>
          </div>

          <div className="composer-actions">
            <button className="secondary" onClick={() => onSave("Draft")}>
              保存草稿
            </button>
            <button className="secondary" onClick={() => window.print()}>
              <Icon name="printer" size={15} />
              打印 / PDF
            </button>
            <button className="primary" onClick={() => onSave("Confirmed")}>
              <Icon name="check" size={15} />
              确认单据
            </button>
          </div>
        </section>

        <section className="panel history-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">SAVED RECORDS</p>
              <h3>已保存单据</h3>
            </div>
          </div>
          {store.documents.length ? (
            <div className="document-history">
              {store.documents.map((doc) => (
                <article key={doc.id} className={draft.id === doc.id ? "editing" : ""}>
                  <span className="doc-badge">{docShort[doc.type]}</span>
                  <div className="doc-info">
                    <b>{doc.number}</b>
                    <small>
                      {doc.date} · {store.customers.find((x) => x.id === doc.customerId)?.company || "客户已删除"}
                    </small>
                  </div>
                  <b className="amount">{money(docTotal(doc.items), doc.currency)}</b>
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
              <p>暂无已保存单据</p>
            </div>
          )}
        </section>
      </div>

      <DocumentPreview
        type={draft.type}
        number={draft.number}
        date={draft.date}
        customer={customer}
        currency={draft.currency}
        lines={draft.lines}
        notes={draft.notes}
        total={total}
      />
    </div>
  );
}
