import type { Customer, DocType, LineItem, Seller } from "../lib/types";
import { amountInWords, money, packTotals } from "../lib/data";

const fmt = (n: number, digits = 2) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(n || 0);

export function DocumentPreview({
  type,
  number,
  date,
  seller,
  customer,
  currency,
  lines,
  notes,
  total,
  incoterm,
  portOfLoading,
  portOfDestination,
  shippingMarks,
}: {
  type: DocType;
  number: string;
  date: string;
  seller: Seller;
  customer?: Customer;
  currency: string;
  lines: LineItem[];
  notes: string;
  total: number;
  incoterm: string;
  portOfLoading: string;
  portOfDestination: string;
  shippingMarks: string;
}) {
  const filled = lines.filter((x) => x.description.trim());
  const isPacking = type === "Packing List";
  const totals = packTotals(filled);
  const hasTrade = incoterm || portOfLoading || portOfDestination;
  const hasBank = !isPacking && (seller.bankName || seller.bankAccount);

  return (
    <section className="document-preview" id="print-document">
      <header className="doc-letterhead">
        <div className="doc-brand">
          <img src="/mytm-logo.png" alt={seller.company} />
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
        <h2>{type.toUpperCase()}</h2>
        <div className="doc-meta">
          <div>
            <small>DOCUMENT NO.</small>
            <b>{number}</b>
          </div>
          <div>
            <small>ISSUE DATE</small>
            <b>{date}</b>
          </div>
          {!isPacking && (
            <div>
              <small>CURRENCY</small>
              <b>{currency}</b>
            </div>
          )}
        </div>
      </div>

      <div className="party">
        <div>
          <small>ISSUED BY</small>
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
          <small>ISSUED TO</small>
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
              <small>TRADE TERMS</small>
              <b>{incoterm}</b>
            </div>
          )}
          {portOfLoading && (
            <div>
              <small>PORT OF LOADING</small>
              <b>{portOfLoading}</b>
            </div>
          )}
          {portOfDestination && (
            <div>
              <small>PORT OF DESTINATION</small>
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
              <th>DESCRIPTION</th>
              <th>QTY</th>
              <th>CTNS</th>
              <th>N.W. (KG)</th>
              <th>G.W. (KG)</th>
              <th>MEAS. (CBM)</th>
            </tr>
          </thead>
          <tbody>
            {filled.map((line, index) => (
              <tr key={line.id}>
                <td>{index + 1}</td>
                <td>{line.description}</td>
                <td>
                  {fmt(line.quantity, 0)} {line.unit}
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
                <td colSpan={2}>TOTAL</td>
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
                <th>DESCRIPTION</th>
                <th>QTY</th>
                <th>UNIT</th>
                <th>UNIT PRICE</th>
                <th>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {filled.map((line, index) => (
                <tr key={line.id}>
                  <td>{index + 1}</td>
                  <td>{line.description}</td>
                  <td>{fmt(line.quantity, 0)}</td>
                  <td>{line.unit}</td>
                  <td>{money(line.unitPrice, currency)}</td>
                  <td>{money(line.quantity * line.unitPrice, currency)}</td>
                </tr>
              ))}
              {!filled.length && (
                <tr>
                  <td colSpan={6} className="preview-placeholder">
                    添加商品后在此预览
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="doc-total">
            <span>GRAND TOTAL{incoterm ? " (" + incoterm + ")" : ""}</span>
            <b>{money(total, currency)}</b>
          </div>
          {filled.length > 0 && <p className="doc-words">{amountInWords(total, currency)}</p>}
        </>
      )}

      {isPacking && shippingMarks && (
        <div className="doc-notes">
          <small>SHIPPING MARKS</small>
          <p>{shippingMarks}</p>
        </div>
      )}

      {hasBank && (
        <div className="doc-bank">
          <small>BANK DETAILS</small>
          <p>
            {seller.bankName && <>Bank: {seller.bankName}<br /></>}
            {seller.bankAccount && <>Account No.: {seller.bankAccount}<br /></>}
            {seller.bankSwift && <>SWIFT: {seller.bankSwift}<br /></>}
            {seller.bankAddress && <>Bank Address: {seller.bankAddress}</>}
          </p>
        </div>
      )}

      <div className="doc-notes">
        <small>TERMS &amp; NOTES</small>
        <p>{notes || "—"}</p>
      </div>

      <div className="signature">
        <span>Authorized signature</span>
        <span>Company stamp</span>
      </div>

      <footer>
        <span>{seller.company} · MyTM Docs</span>
        <span>{seller.tel}</span>
      </footer>
    </section>
  );
}
