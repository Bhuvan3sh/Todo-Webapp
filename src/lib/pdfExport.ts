import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { List, Task } from '../types';

export const exportListToPdf = async (list: List, tasks: Task[]) => {
  // Create an offscreen HTML container for high-fidelity PDF rendering
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.padding = '40px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1e293b';
  container.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  container.style.boxSizing = 'border-box';
  container.style.lineHeight = '1.5';

  const completedCount = tasks.filter((t) => t.is_completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const formattedDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const tableRowsHtml =
    tasks.length === 0
      ? `<tr><td colspan="5" style="padding: 24px; text-align: center; color: #94a3b8; font-style: italic;">No tasks in this list</td></tr>`
      : tasks
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

            // Custom crisp vector checkbox
            const checkboxSvg = isDone
              ? `<div style="width: 18px; height: 18px; border-radius: 4px; background-color: #6C63FF; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                     <polyline points="20 6 9 17 4 12"></polyline>
                   </svg>
                 </div>`
              : `<div style="width: 18px; height: 18px; border-radius: 4px; border: 2px solid #cbd5e1; background-color: #ffffff; margin: 0 auto;"></div>`;

            return `
              <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 10px; text-align: center; vertical-align: top; width: 44px;">
                  ${checkboxSvg}
                </td>
                <td style="padding: 12px 12px; vertical-align: top; width: 220px; word-break: break-word;">
                  <div style="font-size: 13px; font-weight: 600; color: ${isDone ? '#94a3b8' : '#0f172a'}; text-decoration: ${isDone ? 'line-through' : 'none'};">
                    ${task.title}
                  </div>
                </td>
                <td style="padding: 12px 12px; vertical-align: top; word-break: break-word;">
                  <div style="font-size: 12px; color: ${isDone ? '#cbd5e1' : '#475569'}; line-height: 1.4;">
                    ${task.description ? task.description.replace(/\n/g, '<br/>') : '—'}
                  </div>
                </td>
                <td style="padding: 12px 10px; text-align: center; vertical-align: top; width: 80px;">
                  <span style="display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: ${priorityColor}; background-color: ${priorityBg}; border: 1px solid ${priorityColor}30;">
                    ${task.priority}
                  </span>
                </td>
                <td style="padding: 12px 12px; text-align: right; vertical-align: top; width: 90px; white-space: nowrap; font-size: 12px; font-weight: 500; color: #64748b;">
                  ${dueDate}
                </td>
              </tr>
            `;
          })
          .join('');

  container.innerHTML = `
    <div style="border-bottom: 2px solid #6C63FF; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #6C63FF; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
          Task Buddy
        </h1>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; font-weight: 500;">
          Exported on ${formattedDate}
        </p>
      </div>
      <div style="text-align: right;">
        <span style="display: inline-block; padding: 6px 14px; border-radius: 9999px; background-color: #6C63FF15; color: #6C63FF; font-size: 12px; font-weight: 700;">
          ${completedCount} of ${totalCount} Completed (${progressPercent}%)
        </span>
      </div>
    </div>

    <!-- List Header Box -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="width: 14px; height: 14px; border-radius: 50%; background-color: ${list.color || '#6C63FF'}; display: inline-block; flex-shrink: 0;"></span>
        <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #0f172a;">${list.title}</h2>
      </div>
      ${list.description ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #475569; font-weight: 400; line-height: 1.5;">${list.description}</p>` : ''}
      ${list.deadline ? `<p style="margin: 8px 0 0 0; font-size: 12px; font-weight: 600; color: #d97706;">Deadline: ${new Date(list.deadline).toLocaleDateString()}</p>` : ''}
    </div>

    <!-- Tasks Table -->
    <table style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <thead>
        <tr style="background-color: #6C63FF; color: #ffffff;">
          <th style="padding: 12px 10px; width: 44px; text-align: center; font-size: 12px; font-weight: 700;">Done</th>
          <th style="padding: 12px 12px; text-align: left; font-size: 12px; font-weight: 700;">Task Title</th>
          <th style="padding: 12px 12px; text-align: left; font-size: 12px; font-weight: 700;">Description</th>
          <th style="padding: 12px 10px; width: 80px; text-align: center; font-size: 12px; font-weight: 700;">Priority</th>
          <th style="padding: 12px 12px; width: 90px; text-align: right; font-size: 12px; font-weight: 700;">Due Date</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
    </table>

    <!-- Footer -->
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #94a3b8;">
      <span>Task Buddy — Task Management Export</span>
      <span>https://todo.theorave.in</span>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const renderWidth = pdfWidth - 40; // 20pt margins left/right
    const renderHeight = (imgHeight * renderWidth) / imgWidth;

    if (renderHeight <= pdfHeight - 40) {
      pdf.addImage(imgData, 'PNG', 20, 20, renderWidth, renderHeight);
    } else {
      let heightLeft = renderHeight;
      let position = 20;

      pdf.addImage(imgData, 'PNG', 20, position, renderWidth, renderHeight);
      heightLeft -= pdfHeight - 40;

      while (heightLeft > 0) {
        position = heightLeft - renderHeight + 20;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 20, position, renderWidth, renderHeight);
        heightLeft -= pdfHeight;
      }
    }

    const safeTitle = list.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'tasks';
    pdf.save(`${safeTitle}_tasks.pdf`);
  } finally {
    document.body.removeChild(container);
  }
};
