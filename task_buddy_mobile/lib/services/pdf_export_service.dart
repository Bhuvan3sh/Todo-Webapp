import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../models/todo_models.dart';

class PdfExportService {
  static Future<void> exportTasksToPdf({
    required String title,
    required List<TodoTask> tasks,
  }) async {
    final pdf = pw.Document();
    final formattedDate = DateFormat('MMM d, yyyy').format(DateTime.now());
    final completedCount = tasks.where((t) => t.isCompleted).length;

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (pw.Context context) {
          return [
            // Header Branding
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              crossAxisAlignment: pw.CrossAxisAlignment.end,
              children: [
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      'Task Buddy',
                      style: pw.TextStyle(
                        fontSize: 22,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColor.fromHex('#6C63FF'),
                      ),
                    ),
                    pw.SizedBox(height: 2),
                    pw.Text(
                      'Exported on $formattedDate',
                      style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
                    ),
                  ],
                ),
                pw.Container(
                  padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: pw.BoxDecoration(
                    color: PdfColor.fromHex('#6C63FF15'),
                    borderRadius: pw.BorderRadius.circular(12),
                  ),
                  child: pw.Text(
                    '$completedCount of ${tasks.length} Completed',
                    style: pw.TextStyle(
                      fontSize: 10,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColor.fromHex('#6C63FF'),
                    ),
                  ),
                ),
              ],
            ),
            pw.Divider(color: PdfColor.fromHex('#6C63FF'), thickness: 1.5, height: 16),

            // List Title Box
            pw.Container(
              width: double.infinity,
              padding: const pw.EdgeInsets.all(12),
              decoration: pw.BoxDecoration(
                color: PdfColors.grey100,
                borderRadius: pw.BorderRadius.circular(8),
                border: pw.Border.all(color: PdfColors.grey300),
              ),
              child: pw.Text(
                title,
                style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, color: PdfColors.grey900),
              ),
            ),
            pw.SizedBox(height: 16),

            // Tasks Table
            pw.Table(
              border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
              children: [
                // Header Row
                pw.TableRow(
                  decoration: pw.BoxDecoration(color: PdfColor.fromHex('#6C63FF')),
                  children: [
                    pw.Padding(
                      padding: const pw.EdgeInsets.all(8),
                      child: pw.Text('Status', style: pw.TextStyle(color: PdfColors.white, fontWeight: pw.FontWeight.bold, fontSize: 10)),
                    ),
                    pw.Padding(
                      padding: const pw.EdgeInsets.all(8),
                      child: pw.Text('Task Title', style: pw.TextStyle(color: PdfColors.white, fontWeight: pw.FontWeight.bold, fontSize: 10)),
                    ),
                    pw.Padding(
                      padding: const pw.EdgeInsets.all(8),
                      child: pw.Text('Priority', style: pw.TextStyle(color: PdfColors.white, fontWeight: pw.FontWeight.bold, fontSize: 10)),
                    ),
                    pw.Padding(
                      padding: const pw.EdgeInsets.all(8),
                      child: pw.Text('Due Date', style: pw.TextStyle(color: PdfColors.white, fontWeight: pw.FontWeight.bold, fontSize: 10)),
                    ),
                  ],
                ),
                // Task Rows
                ...tasks.map((t) {
                  final dueDateStr = t.dueDate != null ? DateFormat('MMM d').format(t.dueDate!) : '—';
                  return pw.TableRow(
                    children: [
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(8),
                        child: pw.Text(
                          t.isCompleted ? '✓ Done' : '○ Pending',
                          style: pw.TextStyle(
                            fontSize: 10,
                            color: t.isCompleted ? PdfColors.green700 : PdfColors.grey700,
                            fontWeight: pw.FontWeight.bold,
                          ),
                        ),
                      ),
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(8),
                        child: pw.Text(
                          t.title,
                          style: pw.TextStyle(
                            fontSize: 10,
                            color: t.isCompleted ? PdfColors.grey500 : PdfColors.black,
                          ),
                        ),
                      ),
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(8),
                        child: pw.Text(
                          t.priority.toUpperCase(),
                          style: pw.TextStyle(
                            fontSize: 9,
                            fontWeight: pw.FontWeight.bold,
                            color: t.priority == 'high'
                                ? PdfColors.red700
                                : t.priority == 'medium'
                                    ? PdfColors.orange700
                                    : PdfColors.green700,
                          ),
                        ),
                      ),
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(8),
                        child: pw.Text(
                          dueDateStr,
                          style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
                        ),
                      ),
                    ],
                  );
                }),
              ],
            ),
          ];
        },
      ),
    );

    final pdfBytes = await pdf.save();
    await Printing.sharePdf(
      bytes: pdfBytes,
      filename: '${title.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_')}_tasks.pdf',
    );
  }
}
