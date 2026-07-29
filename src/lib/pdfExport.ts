import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { List, Task } from '../types';

export const exportListToPdf = async (list: List, tasks: Task[]) => {
  // Create an offscreen HTML container for high-fidelity PDF rendering with full emoji support
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '780px';
  container.style.padding = '36px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1f2937';
  container.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";
  container.style.boxSizing = 'border-box';

  const completedCount = tasks.filter((t) => t.is_completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const formattedDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  container.innerHTML = `
    <div style="border-bottom: 2px solid #6C63FF; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #6C63FF; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
          <span>☑️</span> Task Buddy
        </h1>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280; font-weight: 500;">
          Exported on ${formattedDate}
        </p>
      </div>
      <div style="text-align: right;">
        <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: #f3f4f6; color: #374151; font-size: 12px; font-weight: 700;">
          ${completedCount}/${totalCount} Completed (${progressPercent}%)
        </span>
      </div>
    </div>

    <!-- List Header Box -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="width: 14px; height: 14px; border-radius: 50%; background-color: ${list.color || '#6C63FF'}; display: inline-block;"></span>
        <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #0f172a;">${list.title}</h2>
      </div>
      ${list.description ? `<p style="margin: 6px 0 0 0; font-size: 12px; color: #475569; font-weight: 400;">${list.description}</p>` : ''}
      ${list.deadline ? `<p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 600; color: #d97706;">📅 Deadline: ${new Date(list.deadline).toLocaleDateString()}</p>` : ''}
    </div>

    <!-- Tasks Table -->
    <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
      <thead>
        <tr style="background-color: #6C63FF; color: #ffffff;">
          <th style="padding: 10px 12px; border-top-left-radius: 8px; width: 44px; text-align: center;">Status</th>
          <th style="padding: 10px 12px;">Task Title</th>
          <th style="padding: 10px 12px;">Description</th>
          <th style="padding: 10px 12px; width: 80px; text-align: center;">Priority</th>
          <th style="padding: 10px 12px; width: 100px; text-align: right; border-top-right-radius: 8px;">Due Date</th>
        </tr>
      </thead>
      <tbody>
        ${
          tasks.length === 0
            ? `<tr><td colspan="5" style="padding: 24px; text-align: center; color: #94a3b8; font-style: italic;">No tasks in this list</td></tr>`
            : tasks
                .map((task, idx) => {
                  const isDone = task.is_completed;
                  const priorityColor =
                    task.priority === 'high'
                      ? '#ef4444'
                      : task.priority === 'medium'
                      ? '#f59e0b'
                      : '#10b981';
                  const priorityBg =
                    task.priority === 'high'
                      ? '#fef2f2'
                      : task.priority === 'medium'
                      ? '#fffbeb'
                      : '#ecfdf5';
                  const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                  const dueDate = task.due_date
                    ? new Date(task.due_date).toLocaleDateString()
                    : '-';

                  return `
            <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 12px; text-align: center; font-size: 14px;">
                ${isDone ? '✅' : '⬜'}
              </td>
              <td style="padding: 10px 12px; font-weight: 600; color: ${isDone ? '#94a3b8' : '#1e293b'}; text-decoration: ${isDone ? 'line-through' : 'none'};">
                ${task.title}
              </td>
              <td style="padding: 10px 12px; color: ${isDone ? '#cbd5e1' : '#64748b'}; font-size: 11px;">
                ${task.description || '-'}
              </td>
              <td style="padding: 10px 12px; text-align: center;">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${priorityColor}; background-color: ${priorityBg}; border: 1px solid ${priorityColor}40;">
                  ${task.priority}
                </span>
              </td>
              <td style="padding: 10px 12px; text-align: right; color: #64748b; font-size: 11px; font-weight: 500;">
                ${dueDate}
              </td>
            </tr>
          `;
                })
                .join('')
        }
      </tbody>
    </table>

    <!-- Footer -->
    <div style="margin-top: 28px; padding-top: 12px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8;">
      <span>Generated by Task Buddy (https://todo.theorave.in)</span>
      <span>Task Buddy PDF Report</span>
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

    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const renderWidth = imgWidth * ratio;
    const renderHeight = imgHeight * ratio;

    const marginX = (pdfWidth - renderWidth) / 2;
    const marginY = 20;

    pdf.addImage(imgData, 'PNG', marginX, marginY, renderWidth, renderHeight);

    const safeTitle = list.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'tasks';
    pdf.save(`${safeTitle}_tasks.pdf`);
  } finally {
    document.body.removeChild(container);
  }
};
