import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { List, Task } from '../types';

function renderPageHtml(
  list: List,
  pageTasks: Task[],
  pageNum: number,
  totalPages: number,
  completedCount: number,
  totalCount: number,
  progressPercent: number,
  formattedDate: string
): string {
  const isFirstPage = pageNum === 1;

  const tableRowsHtml =
    pageTasks.length === 0
      ? `<tr><td colspan="5" style="padding: 24px; text-align: center; color: #94a3b8; font-style: italic;">No tasks on this page</td></tr>`
      : pageTasks
          .map((task, idx) => {
            const isDone = task.is_completed;
            const priorityColor =
              task.priority === 'high'
                ? '#dc2626'
                : task.priority === 'medium'
                ? '#d97706'
                : '#059669';
            const priorityBg =
              task.priority === 'high'
                ? '#fef2f2'
                : task.priority === 'medium'
                ? '#fffbeb'
                : '#ecfdf5';
            const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
            const dueDate = task.due_date
              ? new Date(task.due_date).toLocaleDateString()
              : '—';

            // Vector checkbox
            const checkboxSvg = isDone
              ? `<div style="width: 18px; height: 18px; border-radius: 4px; background-color: #6C63FF; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                     <polyline points="20 6 9 17 4 12"></polyline>
                   </svg>
                 </div>`
              : `<div style="width: 18px; height: 18px; border-radius: 4px; border: 2px solid #cbd5e1; background-color: #ffffff; margin: 0 auto;"></div>`;

            return `
              <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 14px 10px; text-align: center; vertical-align: middle; width: 48px;">
                  <div style="display: flex; align-items: center; justify-content: center;">
                    ${checkboxSvg}
                  </div>
                </td>
                <td style="padding: 14px 12px; vertical-align: middle; width: 210px; word-break: break-word;">
                  <div style="font-size: 13px; font-weight: 600; color: ${isDone ? '#94a3b8' : '#0f172a'}; text-decoration: ${isDone ? 'line-through' : 'none'}; line-height: 1.4;">
                    ${task.title}
                  </div>
                </td>
                <td style="padding: 14px 12px; vertical-align: middle; word-break: break-word;">
                  <div style="font-size: 12px; color: ${isDone ? '#cbd5e1' : '#475569'}; line-height: 1.45;">
                    ${task.description ? task.description.replace(/\n/g, '<br/>') : '—'}
                  </div>
                </td>
                <td style="padding: 14px 10px; text-align: center; vertical-align: middle; width: 85px;">
                  <div style="display: flex; align-items: center; justify-content: center;">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: ${priorityColor}; background-color: ${priorityBg}; border: 1px solid ${priorityColor}40; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
                      ${task.priority}
                    </span>
                  </div>
                </td>
                <td style="padding: 14px 12px; text-align: right; vertical-align: middle; width: 90px; white-space: nowrap; font-size: 12px; font-weight: 500; color: #64748b;">
                  ${dueDate}
                </td>
              </tr>
            `;
          })
          .join('');

  return `
    <div style="border-bottom: 2px solid #6C63FF; padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #6C63FF; letter-spacing: -0.5px;">
          Task Buddy
        </h1>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b; font-weight: 500;">
          Exported on ${formattedDate}
        </p>
      </div>
      <div style="text-align: right;">
        <span style="display: inline-block; padding: 5px 12px; border-radius: 9999px; background-color: #6C63FF15; color: #6C63FF; font-size: 11px; font-weight: 700;">
          ${completedCount} of ${totalCount} Completed (${progressPercent}%)
        </span>
      </div>
    </div>

    ${
      isFirstPage
        ? `
    <!-- List Header Box (Page 1 Only) -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 18px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="width: 12px; height: 12px; border-radius: 50%; background-color: ${list.color || '#6C63FF'}; display: inline-block; flex-shrink: 0;"></span>
        <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #0f172a;">${list.title}</h2>
      </div>
      ${list.description ? `<p style="margin: 6px 0 0 0; font-size: 12px; color: #475569; font-weight: 400; line-height: 1.4;">${list.description}</p>` : ''}
      ${list.deadline ? `<p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 600; color: #d97706;">Deadline: ${new Date(list.deadline).toLocaleDateString()}</p>` : ''}
    </div>
    `
        : `
    <!-- Compact Header (Subsequent Pages) -->
    <div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; padding: 6px 0;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${list.color || '#6C63FF'}; display: inline-block;"></span>
        <span style="font-size: 14px; font-weight: 700; color: #334155;">${list.title} (Continued)</span>
      </div>
    </div>
    `
    }

    <!-- Tasks Table -->
    <table style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
      <thead>
        <tr style="background-color: #6C63FF; color: #ffffff;">
          <th style="padding: 10px; width: 48px; text-align: center; font-size: 11px; font-weight: 700;">Check</th>
          <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700;">Task Title</th>
          <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700;">Description</th>
          <th style="padding: 10px; width: 85px; text-align: center; font-size: 11px; font-weight: 700;">Priority</th>
          <th style="padding: 10px 12px; width: 90px; text-align: right; font-size: 11px; font-weight: 700;">Due Date</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
    </table>

    <!-- Footer -->
    <div style="margin-top: 24px; padding-top: 12px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8;">
      <span>Task Buddy — https://todo.theorave.in</span>
      <span>Page ${pageNum} of ${totalPages}</span>
    </div>
  `;
}

export const exportListToPdf = async (list: List, tasks: Task[]) => {
  const completedCount = tasks.filter((t) => t.is_completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const formattedDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Calculate page splits dynamically using temporary height measurement
  const pagesTasks: Task[][] = [];
  let currentChunk: Task[] = [];

  const measureHeight = (pageIdx: number, testTasks: Task[]) => {
    const cont = document.createElement('div');
    cont.style.position = 'absolute';
    cont.style.left = '-9999px';
    cont.style.top = '-9999px';
    cont.style.width = '780px';
    cont.style.padding = '36px';
    cont.style.backgroundColor = '#ffffff';
    cont.style.color = '#1e293b';
    cont.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    cont.style.boxSizing = 'border-box';

    cont.innerHTML = renderPageHtml(list, testTasks, pageIdx + 1, 999, completedCount, totalCount, progressPercent, formattedDate);
    document.body.appendChild(cont);
    const height = cont.offsetHeight;
    document.body.removeChild(cont);
    return height;
  };

  if (tasks.length === 0) {
    pagesTasks.push([]);
  } else {
    for (const task of tasks) {
      currentChunk.push(task);
      const height = measureHeight(pagesTasks.length, currentChunk);
      // Max page height budget before starting a new page (A4 page height at 780px is ~1030px)
      if (height > 980 && currentChunk.length > 1) {
        currentChunk.pop();
        pagesTasks.push([...currentChunk]);
        currentChunk = [task];
      }
    }
    if (currentChunk.length > 0) {
      pagesTasks.push(currentChunk);
    }
  }

  const totalPages = pagesTasks.length;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();

  for (let i = 0; i < totalPages; i++) {
    const pageTasks = pagesTasks[i];
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '780px';
    container.style.padding = '36px';
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#1e293b';
    container.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    container.style.boxSizing = 'border-box';

    container.innerHTML = renderPageHtml(list, pageTasks, i + 1, totalPages, completedCount, totalCount, progressPercent, formattedDate);
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const renderWidth = pdfWidth - 40;
      const renderHeight = (imgHeight * renderWidth) / imgWidth;

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'PNG', 20, 20, renderWidth, renderHeight);
    } finally {
      document.body.removeChild(container);
    }
  }

  const safeTitle = list.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'tasks';
  pdf.save(`${safeTitle}_tasks.pdf`);
};
