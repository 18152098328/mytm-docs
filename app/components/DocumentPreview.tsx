import type { Customer, LineItem } from "../lib/types";
import { money } from "../lib/data";

export function DocumentPreview({
  type,
  number,
  date,
  customer,
  currency,
  lines,
  notes,
  total,
}: {
  type: string;
  number: string;
  date: string;
  customer?: Customer;
  currency: string;
  lines: LineItem[];
  notes: string;
  total: number;
}) {
  const filled = lines.filter((x) => x.description.trim());
  return (
    <section className="document-preview" id="print-document">
      <header className="doc-letterhead">
        <div className="doc-brand">
          <img src="/mytm-logo.png" alt="MyTM Docs" />
          <div>
            <b>MyTM</b>
            <span>Trade documents, made clear.</span>
          </div>
        </div>
        <div className="doc-contact">
          <span>Tel: 18152098328</span>
          <span>Local Trade Desk</span>
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
          <div>
            <small>CURRENCY</small>
            <b>{currency}</b>
          </div>
        </div>
      </div>

      <div className="party">
        <div>
          <small>ISSUED BY</small>
          <b>MyTM</b>
          <p>Tel: 18152098328</p>
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
              <td>{line.quantity}</td>
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
        <span>GRAND TOTAL</span>
        <b>{money(total, currency)}</b>
      </div>

      <div className="doc-notes">
        <small>TERMS &amp; NOTES</small>
        <p>{notes || "—"}</p>
      </div>

      <div className="signature">
        <span>Authorized signature</span>
        <span>Company stamp</span>
      </div>

      <footer>
        <span>MyTM Docs · Local Trade Desk</span>
        <span>18152098328</span>
      </footer>
    </section>
  );
}
