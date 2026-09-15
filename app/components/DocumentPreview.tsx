import { PointerEvent, useRef, useState } from "react";
import type { Customer, DocLanguage, DocType, LineItem, Product, Seller } from "../lib/types";
import { amountInWords, amountInWordsCn, docNames, money, packTotals } from "../lib/data";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const fmt = (n: number, digits = 2) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(n || 0);

export function DocumentPreview({
  type,
  number,
  date,
  seller,
  customer,
  currency,
  language,
  lines,
  products,
  moq,
  paymentTerms,
  notes,
  total,
  incoterm,
  portOfLoading,
  portOfDestination,
  shippingMarks,
  onStampMove,
}: {
  type: DocType;
  number: string;
  date: string;
  seller: Seller;
  customer?: Customer;
  currency: string;
  language: DocLanguage;
  lines: LineItem[];
  /** Product master, used to resolve line photos. */
  products?: Product[];
  moq: string;
  paymentTerms: string;
  notes: string;
  total: number;
  incoterm: string;
  portOfLoading: string;
  portOfDestination: string;
  shippingMarks: string;
  /** When provided, the stamp can be dragged on the preview; called with the final offset. */
  onStampMove?: (x: number, y: number) => void;
}) {
  const filled = lines.filter((x) => x.description.trim());
  const isPacking = type === "Packing List";
  const totals = packTotals(filled);
  const hasTrade = incoterm || portOfLoading || portOfDestination;
  const hasBank = !isPacking && (seller.bankName || seller.bankAccount);
  const cn = language === "bilingual";
  const isCI = type === "Commercial Invoice";
  const showHs = !isPacking && isCI && filled.some((x) => x.hsCode.trim());
  const showSpec = !isPacking && !isCI && filled.some((x) => x.spec.trim());
  const lineImage = (line: LineItem) =>
    products?.find((p) => p.id === line.productId)?.image || "";
  const showPhoto = !isPacking && filled.some((x) => lineImage(x));
  /** Bilingual label: "EN 中文" when bilingual output is on. */
  const L = (en: string, zh: string) => (cn ? en + " " + zh : en);

  /* ---- draggable stamp ---- */
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ px: number; py: number; bx: number; by: number } | null>(null);
  const stampX = dragOffset ? dragOffset.x : seller.stampX;
  const stampY = dragOffset ? dragOffset.y : seller.stampY;

  function stampDown(e: PointerEvent<HTMLImageElement>) {
    if (!onStampMove) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { px: e.clientX, py: e.clientY, bx: seller.stampX, by: seller.stampY };
  }

  function stampMove(e: PointerEvent<HTMLImageElement>) {
    const d = dragRef.current;
    if (!d) return;
    setDragOffset({
      x: clamp(d.bx + e.clientX - d.px, -260, 260),
      y: clamp(d.by + e.clientY - d.py, -220, 80),
    });
  }

  function stampUp() {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (dragOffset && onStampMove) onStampMove(dragOffset.x, dragOffset.y);
    setDragOffset(null);
  }

  return (
    <section className="document-preview" id="print-document">
      <header className="doc-letterhead">
        <div className="doc-brand">
          <img src={seller.logoImage || "/mytm-logo.png"} alt={seller.company} />
          <div>
            <b>{seller.company}</b>
            {seller.address && <span>{seller.address}</span>}
          </div>
        </div>
        <div className="doc-contact">
          {seller.tel && <span>Tel: {seller.tel}</span>}
          {seller.email && <span>{seller.email}</span>}
          {seller.taxId && <span>Tax ID: {seller.taxId}</span>}
        </div>
      </header>

      <div className="doc-title">
        <div>
          <h2>{type.toUpperCase()}</h2>
          {cn && <p className="doc-title-cn">{docNames[type]}</p>}
        </div>
        <div className="doc-meta">
          <div>
            <small>{L("DOCUMENT NO.", "单据号")}</small>
            <b>{number}</b>
          </div>
          <div>
            <small>{L("ISSUE DATE", "日期")}</small>
            <b>{date}</b>
          </div>
          {!isPacking && (
            <div>
              <small>{L("CURRENCY", "币种")}</small>
              <b>{currency}</b>
            </div>
          )}
        </div>
      </div>

      <div className="party">
        <div>
          <small>{L("ISSUED BY", "卖方")}</small>
          <b>{seller.company}</b>
          <p>
            {seller.address}
            {seller.address && <br />}
            {seller.tel && <>Tel: {seller.tel}</>}
            {seller.tel && seller.email && <br />}
            {seller.email}
          </p>
        </div>
        <div>
          <small>{L("ISSUED TO", "买方")}</small>
          <b>{customer?.company || "（请选择客户）"}</b>
          <p>
            {customer?.contact}
            {customer?.contact && <br />}
            {customer?.address}
            {customer?.address && <br />}
            {customer?.email}
          </p>
        </div>
      </div>

      {hasTrade && (
        <div className="doc-trade">
          {incoterm && (
            <div>
              <small>{L("TRADE TERMS", "贸易术语")}</small>
              <b>{incoterm}</b>
            </div>
          )}
          {portOfLoading && (
            <div>
              <small>{L("PORT OF LOADING", "起运港")}</small>
              <b>{portOfLoading}</b>
            </div>
          )}
          {portOfDestination && (
            <div>
              <small>{L("PORT OF DESTINATION", "目的港")}</small>
              <b>{portOfDestination}</b>
            </div>
          )}
        </div>
      )}

      {isPacking ? (
        <table className="doc-table packing">
          <thead>
            <tr>
              <th>#</th>
              <th>{L("DESCRIPTION", "品名")}</th>
              <th>{L("QTY", "数量")}</th>
              <th>{L("CTNS", "箱数")}</th>
              <th>{L("N.W. (KG)", "净重")}</th>
              <th>{L("G.W. (KG)", "毛重")}</th>
              <th>{L("MEAS. (CBM)", "体积")}</th>
            </tr>
          </thead>
          <tbody>
            {filled.map((line, index) => (
              <tr key={line.id}>
                <td>{index + 1}</td>
                <td>{line.description}</td>
                <td>
                  {fmt(line.quantity, 0)} {line.unit}
                  {line.pcsPerCarton > 0 && (
                    <span className="qty-sub">@{fmt(line.pcsPerCarton, 0)}/CTN</span>
                  )}
                </td>
                <td>{fmt(line.cartons, 0)}</td>
                <td>{fmt(line.netWeight)}</td>
                <td>{fmt(line.grossWeight)}</td>
                <td>{fmt(line.volume, 3)}</td>
              </tr>
            ))}
            {!filled.length && (
              <tr>
                <td colSpan={7} className="preview-placeholder">
                  添加商品后在此预览
                </td>
              </tr>
            )}
          </tbody>
          {filled.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={2}>{L("TOTAL", "合计")}</td>
                <td>{fmt(totals.quantity, 0)}</td>
                <td>{fmt(totals.cartons, 0)}</td>
                <td>{fmt(totals.netWeight)}</td>
                <td>{fmt(totals.grossWeight)}</td>
                <td>{fmt(totals.volume, 3)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      ) : (
        <>
          <table className="doc-table">
            <thead>
              <tr>
                <th>#</th>
                {showPhoto && <th>{L("PHOTO", "图片")}</th>}
                <th>{L("DESCRIPTION", "品名描述")}</th>
                {showSpec && <th>{L("SPEC.", "规格型号")}</th>}
                {showHs && <th>{L("HS CODE", "海关编码")}</th>}
                <th>{L("QTY", "数量")}</th>
                <th>{L("UNIT", "单位")}</th>
                <th>{L("UNIT PRICE", "单价")}</th>
                <th>{L("AMOUNT", "金额")}</th>
              </tr>
            </thead>
            <tbody>
              {filled.map((line, index) => (
                <tr key={line.id}>
                  <td>{index + 1}</td>
                  {showPhoto && (
                    <td className="photo-cell">
                      {lineImage(line) && <img src={lineImage(line)} alt="" />}
                    </td>
                  )}
                  <td>{line.description}</td>
                  {showSpec && <td className="spec-cell">{line.spec}</td>}
                  {showHs && <td className="hs-cell">{line.hsCode}</td>}
                  <td>{fmt(line.quantity, 0)}</td>
                  <td>{line.unit}</td>
                  <td>{money(line.unitPrice, currency)}</td>
                  <td>{money(line.quantity * line.unitPrice, currency)}</td>
                </tr>
              ))}
              {!filled.length && (
                <tr>
                  <td
                    colSpan={6 + (showHs ? 1 : 0) + (showSpec ? 1 : 0) + (showPhoto ? 1 : 0)}
                    className="preview-placeholder"
                  >
                    添加商品后在此预览
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="doc-total">
            <span>
              {L("GRAND TOTAL", "总计")}
              {incoterm ? " (" + incoterm + ")" : ""}
            </span>
            <b>{money(total, currency)}</b>
          </div>
          {filled.length > 0 && (
            <>
              <p className="doc-words">{amountInWords(total, currency)}</p>
              {cn && <p className="doc-words">{amountInWordsCn(total, currency)}</p>}
            </>
          )}
        </>
      )}

      {isPacking && shippingMarks && (
        <div className="doc-notes">
          <small>{L("SHIPPING MARKS", "唛头")}</small>
          <p>{shippingMarks}</p>
        </div>
      )}

      {type === "Quotation" && moq && (
        <div className="doc-notes">
          <small>{L("MOQ", "最小起订量")}</small>
          <p>{moq}</p>
        </div>
      )}

      {!isPacking && paymentTerms && (
        <div className="doc-notes">
          <small>{L("PAYMENT TERMS", "付款条款")}</small>
          <p>{paymentTerms}</p>
        </div>
      )}

      {hasBank && (
        <div className="doc-bank">
          <small>{L("BANK DETAILS", "银行信息")}</small>
          <p>
            {seller.bankName && <>Bank: {seller.bankName}<br /></>}
            {seller.bankAccount && <>Account No.: {seller.bankAccount}<br /></>}
            {seller.bankSwift && <>SWIFT: {seller.bankSwift}<br /></>}
            {seller.bankAddress && <>Bank Address: {seller.bankAddress}</>}
          </p>
        </div>
      )}

      <div className="doc-notes">
        <small>{L("TERMS & NOTES", "条款与备注")}</small>
        <p>{notes || "—"}</p>
      </div>

      <div className="signature">
        <span>{L("Authorized signature", "授权签字")}</span>
        <span className="stamp-spot">
          {seller.stampImage && (
            <img
              className={"stamp" + (onStampMove ? " draggable" : "")}
              src={seller.stampImage}
              alt=""
              style={{ transform: "translate(calc(-50% + " + stampX + "px), " + stampY + "px) rotate(-8deg)" }}
              title={onStampMove ? "拖动调整印章位置" : undefined}
              onPointerDown={stampDown}
              onPointerMove={stampMove}
              onPointerUp={stampUp}
              onPointerCancel={stampUp}
            />
          )}
          {L("Company stamp", "公司盖章")}
        </span>
      </div>

      <footer>
        <span>{seller.company} · MyTM Docs</span>
        <span>{seller.tel}</span>
      </footer>
    </section>
  );
}
