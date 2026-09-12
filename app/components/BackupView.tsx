import { ChangeEvent } from "react";
import { Icon } from "./icons";

export function BackupView({
  onExport,
  onImport,
}: {
  onExport: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="page backup-page">
      <section className="backup-hero panel">
        <div className="backup-art">
          <Icon name="shield" size={30} />
        </div>
        <div>
          <p className="eyebrow">YOUR DATA, YOUR CONTROL</p>
          <h2>把业务资料握在自己手里。</h2>
          <p>
            MyTM Docs 使用浏览器本地存储。建议定期导出 JSON
            完整备份，特别是在更换电脑或清理浏览器之前。
          </p>
          <div className="backup-actions">
            <button className="primary" onClick={onExport}>
              <Icon name="download" size={16} />
              导出完整备份
            </button>
            <label className="secondary file-button">
              <Icon name="upload" size={16} />
              恢复备份
              <input type="file" accept="application/json,.json" onChange={onImport} />
            </label>
          </div>
        </div>
      </section>
      <section className="backup-grid">
        <article className="panel">
          <span>01</span>
          <h3>离线优先</h3>
          <p>客户、商品和单据不会主动上传至外部服务。</p>
        </article>
        <article className="panel">
          <span>02</span>
          <h3>可迁移</h3>
          <p>一个 JSON 文件包含当前所有业务记录。</p>
        </article>
        <article className="panel">
          <span>03</span>
          <h3>易恢复</h3>
          <p>选择之前的备份文件，即可恢复整个工作台。</p>
        </article>
      </section>
    </div>
  );
}
