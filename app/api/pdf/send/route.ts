import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 初始化 SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// 多语言文本
const translations: Record<string, Record<string, string>> = {
  zh: {
    title: '采购清单',
    disclaimer: '免责声明：本清单中的价格为人民币出厂价，不含国际运费和关税。实际采购时请以商家最终报价为准。',
    total: '合计',
    items: '商品数量',
    price: '单价',
    quantity: '数量',
    subtotal: '小计',
    shop: '店铺',
    link: '购买链接',
    generatedAt: '生成时间',
  },
  en: {
    title: 'Sourcing List',
    disclaimer: 'Disclaimer: Prices are in RMB (factory price), excluding international shipping and customs duties. Please confirm final price with seller.',
    total: 'Total',
    items: 'Items',
    price: 'Price',
    quantity: 'Qty',
    subtotal: 'Subtotal',
    shop: 'Shop',
    link: 'Purchase Link',
    generatedAt: 'Generated at',
  },
  ru: {
    title: 'Список закупок',
    disclaimer: 'Отказ от ответственности: Цены указаны в юанях (заводская цена), без учета международной доставки и таможенных пошлин.',
    total: 'Итого',
    items: 'Товаров',
    price: 'Цена',
    quantity: 'Кол-во',
    subtotal: 'Сумма',
    shop: 'Магазин',
    link: 'Ссылка',
    generatedAt: 'Создано',
  },
  ar: {
    title: 'قائمة التوريد',
    disclaimer: 'إخلاء المسؤولية: الأسعار باليوان الصيني (سعر المصنع)، لا تشمل الشحن الدولي والرسوم الجمركية.',
    total: 'المجموع',
    items: 'المنتجات',
    price: 'السعر',
    quantity: 'الكمية',
    subtotal: 'المجموع الفرعي',
    shop: 'المتجر',
    link: 'رابط الشراء',
    generatedAt: 'تم الإنشاء في',
  },
  es: {
    title: 'Lista de Abastecimiento',
    disclaimer: 'Descargo de responsabilidad: Los precios están en RMB (precio de fábrica), excluyendo envío internacional y aranceles.',
    total: 'Total',
    items: 'Artículos',
    price: 'Precio',
    quantity: 'Cant',
    subtotal: 'Subtotal',
    shop: 'Tienda',
    link: 'Enlace de compra',
    generatedAt: 'Generado el',
  }
};

// 生成简单 HTML PDF（使用表格布局）
function generatePDFHTML(items: any[], lang: string): string {
  const t = translations[lang] || translations.en;
  const total = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  
  const itemsHTML = items.map((item, index) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px;">${index + 1}</td>
      <td style="padding: 12px;">
        ${item.image ? `<img src="${item.image}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />` : ''}
      </td>
      <td style="padding: 12px; max-width: 200px;">${item.title}</td>
      <td style="padding: 12px;">¥${item.price}</td>
      <td style="padding: 12px;">${item.shop || '-'}</td>
      <td style="padding: 12px; font-size: 10px; word-break: break-all;">
        <a href="${item.link}" style="color: #4F6DF5;">${item.link}</a>
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        h1 { color: #4F6DF5; border-bottom: 2px solid #4F6DF5; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: bold; }
        td { vertical-align: top; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        .disclaimer { color: #6b7280; font-size: 11px; margin-top: 20px; }
        .total { font-size: 16px; font-weight: bold; color: #4F6DF5; margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>${t.title}</h1>
      <p>${t.generatedAt}: ${new Date().toLocaleString(lang === 'zh' ? 'zh-CN' : lang === 'ru' ? 'ru-RU' : 'en-US')}</p>
      
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Image</th>
            <th>${t.items}</th>
            <th>${t.price}</th>
            <th>${t.shop}</th>
            <th>${t.link}</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
      
      <div class="total">
        ${t.total}: ¥${total.toFixed(2)} (${items.length} ${t.items})
      </div>
      
      <div class="disclaimer">
        ${t.disclaimer}
      </div>
    </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, email, lang = 'en' } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!SENDGRID_API_KEY) {
      return NextResponse.json(
        { error: 'SendGrid not configured' },
        { status: 500 }
      );
    }

    console.log(`[PDF Send] Generating PDF for ${items.length} items, sending to ${email}`);

    // 生成 HTML 内容
    const htmlContent = generatePDFHTML(items, lang);
    const t = translations[lang] || translations.en;

    // 使用 SendGrid 发送 HTML 邮件（作为 PDF 的替代方案）
    // 注意：SendGrid 免费版不支持附件，我们用 HTML 邮件代替
    const msg = {
      to: email,
      from: 'noreply@sourcepilot.cn',
      subject: `${t.title} - SourcePilot`,
      html: htmlContent,
    };

    await sgMail.send(msg);

    return NextResponse.json({
      success: true,
      message: `Sourcing list sent to ${email}`,
      itemCount: items.length
    });

  } catch (error) {
    console.error('[PDF Send] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
