import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/todo_models.dart';
import '../theme/app_theme.dart';
import 'neumorphic_card.dart';

class TaskCard extends StatelessWidget {
  final TodoTask task;
  final VoidCallback onToggle;
  final VoidCallback onDelete;

  const TaskCard({
    super.key,
    required this.task,
    required this.onToggle,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isDone = task.isCompleted;

    Color priorityTextColor = AppTheme.priorityMediumText;
    Color priorityBgColor = AppTheme.priorityMediumBg;

    if (task.priority == 'high') {
      priorityTextColor = AppTheme.priorityHighText;
      priorityBgColor = AppTheme.priorityHighBg;
    } else if (task.priority == 'low') {
      priorityTextColor = AppTheme.priorityLowText;
      priorityBgColor = AppTheme.priorityLowBg;
    }

    return NeumorphicCard(
      margin: const EdgeInsets.only(bottom: 12),
      isSunken: isDone,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Neumorphic Checkbox Button
          GestureDetector(
            onTap: onToggle,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 26,
              height: 26,
              decoration: BoxDecoration(
                color: isDone ? AppTheme.primaryColor : AppTheme.backgroundColorLight,
                borderRadius: BorderRadius.circular(8),
                boxShadow: isDone ? AppTheme.accentButtonShadow() : AppTheme.raisedSmShadow(),
              ),
              child: isDone
                  ? const Icon(Icons.check, size: 18, color: Colors.white)
                  : null,
            ),
          ),
          const SizedBox(width: 14),

          // Title & Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  task.title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: isDone ? AppTheme.textSecondaryLight : AppTheme.textPrimaryLight,
                    decoration: isDone ? TextDecoration.lineThrough : null,
                  ),
                ),
                if (task.description != null && task.description!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    task.description!,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppTheme.textSecondaryLight,
                      height: 1.3,
                    ),
                  ),
                ],
                const SizedBox(height: 10),
                // Wrap Badges cleanly to prevent any horizontal overflow
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: [
                    // Priority Badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: priorityBgColor,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: priorityTextColor.withOpacity(0.3)),
                      ),
                      child: Text(
                        task.priority.toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: priorityTextColor,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),

                    // Due Date Badge
                    if (task.dueDate != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.schedule, size: 12, color: AppTheme.primaryColor),
                            const SizedBox(width: 4),
                            Text(
                              DateFormat('MMM d, h:mm a').format(task.dueDate!),
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),

          // Delete Button
          IconButton(
            icon: const Icon(Icons.delete_outline, size: 20, color: Color(0xFFEF4444)),
            onPressed: onDelete,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }
}
