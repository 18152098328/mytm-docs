import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyTM Docs | 本地外贸单据工作台",
  description: "MyTM 的本地优先外贸客户、商品与单据工作台。",
  icons: { icon: "/mytm-logo.png", shortcut: "/mytm-logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
