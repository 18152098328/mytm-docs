import type { DocType, Store, TradeDocument } from "../lib/types";
import { docNames, docShort, docTotal, docTypes, money } from "../lib/data";
import { Icon } from "./icons";

export function DashboardView({
  store,
  onNewDocument,
  onEditDocument,
  onShowDocuments,
}: {
  store: Store;
  onNewDocument: (type: DocType) => void;
  onEditDocument: (doc: TradeDocument) => void;
  onShowDocuments: () => void;
}) {
  const confirmed = store.documents.filter((x) => x.status === "Confirmed").length;
  return (
    <div className="page dashboard-page">
      <section className="hero-card">
        <div>
          <span className="hero-kicker">LOCAL-FIRST · PRIVATE · READY</span>
          <h2>
            从客户资料到正式单据，
            <br />
            让外贸工作更清晰。
          </h2>
          <p>客户、商品与单据关联保存。数据留在你的电脑，随时备份。</p>
          <button className="hero-cta" onClick={() => onNewDocument("Quotation")}>
            开始制单
            <Icon name="arrow-right" size={16} />
          </button>
        </div>
        <div className="hero-mark">
          <img src="/mytm-logo.png" alt="" />
        </div>
      </section>

      <section className="metric-grid">
        <article>
          <span className="metric-icon blue">
            <Icon name="customers" size={20} />
          </span>
          <div>
            <small>客户数</small>
            <strong>{store.customers.length}</strong>
            <p>可直接复用于新单据</p>
          </div>
        </article>
        <article>
          <span className="metric-icon cyan">
            <Icon name="products" size={20} />
          </span>
          <div>
            <small>商品数</small>
            <strong>{store.products.length}</strong>
            <p>已保存 SKU 与价格</p>
          </div>
        </article>
        <article>
          <span className="metric-icon amber">
            <Icon name="documents" size={20} />
          </span>
          <div>
            <small>单据总数</small>
            <strong>{store.documents.length}</strong>
            <p>{confirmed} 份已确认</p>
          </div>
        </article>
      </section>

      <section className="split-grid">
        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">QUICK START</p>
              <h3>今天做什么？</h3>
            </div>
          </div>
          <div className="quick-grid">
            {docTypes.map((type) => (
              <button key={type} onClick={() => onNewDocument(type)}>
                <b>{docShort[type]}</b>
                <span>
                  新建{docNames[type]}
                  <small>{type}</small>
                </span>
                <Icon name="arrow-right" size={15} />
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">RECENT DOCUMENTS</p>
              <h3>最近单据</h3>
            </div>
            <button className="text-button" onClick={onShowDocuments}>
              查看全部
            </button>
          </div>
          {store.documents.length ? (
            <div className="recent-list">
              {store.documents.slice(0, 6).map((doc) => (
                <button key={doc.id} className="recent-row" onClick={() => onEditDocument(doc)}>
                  <span className="doc-badge">{docShort[doc.type]}</span>
                  <div>
                    <b>{doc.number}</b>
                    <small>{store.customers.find((x) => x.id === doc.customerId)?.company || "客户已删除"}</small>
                  </div>
                  <b className="amount">{money(docTotal(doc.items), doc.currency)}</b>
                  <span className={"tag" + (doc.status === "Confirmed" ? " confirmed" : "")}>
                    {doc.status === "Confirmed" ? "已确认" : "草稿"}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Icon name="documents" size={26} />
              <b>还没有单据</b>
              <p>创建第一份报价单后，会显示在这里。</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
